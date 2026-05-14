import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

// Decomposed Falling Lines. The legacy GLSL looks like it has a loop but
// every per-pixel computation is independent — there's no actual iteration,
// just `floor(p.x * density)` → per-column hash → lane offset → stroke mask.
// Fully expressible as a DAG.
export default {
  id: "falling-lines",
  name: "Falling Lines",
  description: "Directional falling streaks — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "colorA", type: "vec3", label: "Color A", default: [1, 1, 1] },
      { id: "colorB", type: "vec3", label: "Color B", default: [1, 1, 1] },
      { id: "angle", type: "float", label: "Angle (deg)", default: 90 },
      { id: "speed", type: "float", label: "Speed", default: 0.5 },
      { id: "speedVariance", type: "float", label: "Speed Variance", default: 0.3 },
      { id: "density", type: "float", label: "Density", default: 15 },
      { id: "trailLength", type: "float", label: "Trail Length", default: 0.35 },
      { id: "balance", type: "float", label: "Balance", default: 0.5 },
      { id: "strokeWidth", type: "float", label: "Stroke Width", default: 0.15 },
      { id: "rounding", type: "float", label: "Rounding", default: 1 },
    ]);
    const p = b.position();
    const t = b.time();

    // Rotate p by -(angle - 90) deg → radians
    const angOff = b.add("math", { op: "sub" }, { b: 90 });
    b.connect(gi.angle, angOff.nodeId, "a");
    const angRadPos = b.add("math", { op: "mul" }, { b: Math.PI / 180 });
    b.connect(angOff, angRadPos.nodeId, "a");
    const angRad = b.add("math", { op: "neg" });
    b.connect(angRadPos, angRad.nodeId, "x");
    const pRot = b.add("vector-math", { op: "rotate-2d" });
    b.connect(p, pRot.nodeId, "a");
    b.connect(angRad, pRot.nodeId, "b");

    const sepP = b.add("separate-xy", {});
    b.connect(pRot, sepP.nodeId, "v");
    const px = { nodeId: sepP.nodeId, pin: "x" };
    const py = { nodeId: sepP.nodeId, pin: "y" };

    // colId = floor(p.x * density)
    const pxDens = b.add("math", { op: "mul" });
    b.connect(px, pxDens.nodeId, "a");
    b.connect(gi.density, pxDens.nodeId, "b");
    const colId = b.add("math", { op: "floor" });
    b.connect(pxDens, colId.nodeId, "x");

    // jit = hash(vec2(colId, 7.0))
    const hIn = b.add("combine-xy", {}, { y: 7 });
    b.connect(colId, hIn.nodeId, "x");
    const jit = b.add("white-noise-texture", {});
    b.connect(hIn, jit.nodeId, "p");

    // jSpd = mix(1 - speedVar, 1 + speedVar, jit)
    //      = (1 - speedVar) + jit * (2 * speedVar)
    const oneMinusSv = b.add("math", { op: "sub" }, { a: 1 });
    b.connect(gi.speedVariance, oneMinusSv.nodeId, "b");
    const twoSv = b.add("math", { op: "mul" }, { a: 2 });
    b.connect(gi.speedVariance, twoSv.nodeId, "b");
    const jitTwoSv = b.add("math", { op: "mul" });
    b.connect(jit, jitTwoSv.nodeId, "a");
    b.connect(twoSv, jitTwoSv.nodeId, "b");
    const jSpd = b.add("math", { op: "add" });
    b.connect(oneMinusSv, jSpd.nodeId, "a");
    b.connect(jitTwoSv, jSpd.nodeId, "b");

    // yOff = t * speed * 0.6 * jSpd + jit * 9.7
    const tSpeed = b.add("math", { op: "mul" });
    b.connect(t, tSpeed.nodeId, "a");
    b.connect(gi.speed, tSpeed.nodeId, "b");
    const tSpeed06 = b.add("math", { op: "mul" }, { b: 0.6 });
    b.connect(tSpeed, tSpeed06.nodeId, "a");
    const tSpeed06Jit = b.add("math", { op: "mul" });
    b.connect(tSpeed06, tSpeed06Jit.nodeId, "a");
    b.connect(jSpd, tSpeed06Jit.nodeId, "b");
    const jit97 = b.add("math", { op: "mul" }, { b: 9.7 });
    b.connect(jit, jit97.nodeId, "a");
    const yOff = b.add("math", { op: "add" });
    b.connect(tSpeed06Jit, yOff.nodeId, "a");
    b.connect(jit97, yOff.nodeId, "b");

    // spacing = max(trailLength * 1.6, 0.05)
    const trailSpacing = b.add("math", { op: "mul" }, { b: 1.6 });
    b.connect(gi.trailLength, trailSpacing.nodeId, "a");
    const spacing = b.add("math", { op: "max" }, { b: 0.05 });
    b.connect(trailSpacing, spacing.nodeId, "a");

    // lane = fract(p.y + yOff) / spacing
    const pyYOff = b.add("math", { op: "add" });
    b.connect(py, pyYOff.nodeId, "a");
    b.connect(yOff, pyYOff.nodeId, "b");
    const fractLane = b.add("math", { op: "fract" });
    b.connect(pyYOff, fractLane.nodeId, "x");
    const lane = b.add("math", { op: "div" });
    b.connect(fractLane, lane.nodeId, "a");
    b.connect(spacing, lane.nodeId, "b");

    // along = clamp(lane, 0, 1); on = step(lane, 1.0)
    const along = b.add("map-range", {
      fromMin: 0, fromMax: 1, toMin: 0, toMax: 1, interp: "linear", clamp: true,
    });
    b.connect(lane, along.nodeId, "x");
    const on = b.add("math", { op: "step" }, { b: 1 });
    b.connect(lane, on.nodeId, "a");

    // xLoc = (fract(p.x * density) - 0.5) * 2.0
    const fracPxDens = b.add("math", { op: "fract" });
    b.connect(pxDens, fracPxDens.nodeId, "x");
    const fracMinusHalf = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(fracPxDens, fracMinusHalf.nodeId, "a");
    const xLoc = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(fracMinusHalf, xLoc.nodeId, "a");
    const absXLoc = b.add("math", { op: "abs" });
    b.connect(xLoc, absXLoc.nodeId, "x");

    // halfW = clamp(strokeWidth, 0.001, 1) — close enough with MapRange
    const halfW = b.add("map-range", {
      fromMin: 0.001, fromMax: 1, toMin: 0.001, toMax: 1, interp: "linear", clamp: true,
    });
    b.connect(gi.strokeWidth, halfW.nodeId, "x");
    // halfW95 = halfW * 0.95
    const halfW95 = b.add("math", { op: "mul" }, { b: 0.95 });
    b.connect(halfW, halfW95.nodeId, "a");

    // stroke = 1 - smoothstep(halfW95, halfW, absXLoc)
    const ssStroke = b.add("smoothstep", {});
    b.connect(halfW95, ssStroke.nodeId, "edge0");
    b.connect(halfW, ssStroke.nodeId, "edge1");
    b.connect(absXLoc, ssStroke.nodeId, "x");
    const stroke = b.add("math", { op: "oneminus" });
    b.connect(ssStroke, stroke.nodeId, "x");

    // cap = 1 - smoothstep(0.95, 1.0, along)
    const ssCap = b.add("smoothstep", {}, { edge0: 0.95, edge1: 1 });
    b.connect(along, ssCap.nodeId, "x");
    const cap = b.add("math", { op: "oneminus" });
    b.connect(ssCap, cap.nodeId, "x");

    // rcap = mix(1, cap, rounding) = 1 + rounding * (cap - 1)
    const capMinusOne = b.add("math", { op: "sub" }, { b: 1 });
    b.connect(cap, capMinusOne.nodeId, "a");
    const roundCapMinusOne = b.add("math", { op: "mul" });
    b.connect(gi.rounding, roundCapMinusOne.nodeId, "a");
    b.connect(capMinusOne, roundCapMinusOne.nodeId, "b");
    const rcap = b.add("math", { op: "add" }, { a: 1 });
    b.connect(roundCapMinusOne, rcap.nodeId, "b");

    // mask = stroke * on * rcap
    const m1 = b.add("math", { op: "mul" });
    b.connect(stroke, m1.nodeId, "a");
    b.connect(on, m1.nodeId, "b");
    const mask = b.add("math", { op: "mul" });
    b.connect(m1, mask.nodeId, "a");
    b.connect(rcap, mask.nodeId, "b");

    // tColor = clamp(along + (balance - 0.5), 0, 1)
    const balMinusHalf = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(gi.balance, balMinusHalf.nodeId, "a");
    const alongBal = b.add("math", { op: "add" });
    b.connect(along, alongBal.nodeId, "a");
    b.connect(balMinusHalf, alongBal.nodeId, "b");
    const tColor = b.add("map-range", {
      fromMin: 0, fromMax: 1, toMin: 0, toMax: 1, interp: "linear", clamp: true,
    });
    b.connect(alongBal, tColor.nodeId, "x");

    // color = mix(colorA, colorB, tColor)
    const color = b.add("mix-color", {});
    b.connect(gi.colorA, color.nodeId, "a");
    b.connect(gi.colorB, color.nodeId, "b");
    b.connect(tColor, color.nodeId, "t");

    // final = mix(black, color, mask) — `a` defaults to vec3(0).
    const final = b.add("mix-color", {});
    b.connect(color, final.nodeId, "b");
    b.connect(mask, final.nodeId, "t");

    return b.output(final);
  },
} satisfies ProceduralPreset;
