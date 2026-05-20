import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Falling Lines",
  description: "Directional falling streaks",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

// Decomposed Falling Lines. The legacy GLSL looks like it has a loop but
// every per-pixel computation is independent — there's no actual iteration,
// just `floor(p.x * density)` → per-column hash → lane offset → stroke mask.
// Fully expressible as a DAG.
export class FallingLines extends ProceduralShader {
  static readonly typeId = "falling-lines";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
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
    const angOff = b.add(new N.Math({ op: "sub" }), { b: 90 });
    b.connect(gi.angle).to(angOff, "a");
    const angRadPos = b.add(new N.Math({ op: "mul" }), { b: Math.PI / 180 });
    b.connect(angOff).to(angRadPos, "a");
    const angRad = b.add(new N.Math({ op: "neg" }));
    b.connect(angRadPos).to(angRad, "x");
    const pRot = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(p).to(pRot, "a");
    b.connect(angRad).to(pRot, "b");

    const sepP = b.add(new N.SeparateXy());
    b.connect(pRot).to(sepP, "v");
    const px = { nodeId: sepP.nodeId, pin: "x" };
    const py = { nodeId: sepP.nodeId, pin: "y" };

    // colId = floor(p.x * density)
    const pxDens = b.add(new N.Math({ op: "mul" }));
    b.connect(px).to(pxDens, "a");
    b.connect(gi.density).to(pxDens, "b");
    const colId = b.add(new N.Math({ op: "floor" }));
    b.connect(pxDens).to(colId, "x");

    // jit = hash(vec2(colId, 7.0))
    const hIn = b.add(new N.CombineXy(), { y: 7 });
    b.connect(colId).to(hIn, "x");
    const jit = b.add(new N.Hash());
    b.connect(hIn).to(jit, "p");

    // jSpd = mix(1 - speedVar, 1 + speedVar, jit)
    //      = (1 - speedVar) + jit * (2 * speedVar)
    const oneMinusSv = b.add(new N.Math({ op: "sub" }), { a: 1 });
    b.connect(gi.speedVariance).to(oneMinusSv, "b");
    const twoSv = b.add(new N.Math({ op: "mul" }), { a: 2 });
    b.connect(gi.speedVariance).to(twoSv, "b");
    const jitTwoSv = b.add(new N.Math({ op: "mul" }));
    b.connect(jit).to(jitTwoSv, "a");
    b.connect(twoSv).to(jitTwoSv, "b");
    const jSpd = b.add(new N.Math({ op: "add" }));
    b.connect(oneMinusSv).to(jSpd, "a");
    b.connect(jitTwoSv).to(jSpd, "b");

    // yOff = t * speed * 0.6 * jSpd + jit * 9.7
    const tSpeed = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(tSpeed, "a");
    b.connect(gi.speed).to(tSpeed, "b");
    const tSpeed06 = b.add(new N.Math({ op: "mul" }), { b: 0.6 });
    b.connect(tSpeed).to(tSpeed06, "a");
    const tSpeed06Jit = b.add(new N.Math({ op: "mul" }));
    b.connect(tSpeed06).to(tSpeed06Jit, "a");
    b.connect(jSpd).to(tSpeed06Jit, "b");
    const jit97 = b.add(new N.Math({ op: "mul" }), { b: 9.7 });
    b.connect(jit).to(jit97, "a");
    const yOff = b.add(new N.Math({ op: "add" }));
    b.connect(tSpeed06Jit).to(yOff, "a");
    b.connect(jit97).to(yOff, "b");

    // spacing = max(trailLength * 1.6, 0.05)
    const trailSpacing = b.add(new N.Math({ op: "mul" }), { b: 1.6 });
    b.connect(gi.trailLength).to(trailSpacing, "a");
    const spacing = b.add(new N.Math({ op: "max" }), { b: 0.05 });
    b.connect(trailSpacing).to(spacing, "a");

    // lane = fract(p.y + yOff) / spacing
    const pyYOff = b.add(new N.Math({ op: "add" }));
    b.connect(py).to(pyYOff, "a");
    b.connect(yOff).to(pyYOff, "b");
    const fractLane = b.add(new N.Math({ op: "fract" }));
    b.connect(pyYOff).to(fractLane, "x");
    const lane = b.add(new N.Math({ op: "div" }));
    b.connect(fractLane).to(lane, "a");
    b.connect(spacing).to(lane, "b");

    // along = clamp(lane, 0, 1); on = step(lane, 1.0)
    const along = b.add(new N.MapRange({
      fromMin: 0, fromMax: 1, toMin: 0, toMax: 1, interp: "linear", clamp: true,
    }));
    b.connect(lane).to(along, "x");
    const on = b.add(new N.Math({ op: "step" }), { b: 1 });
    b.connect(lane).to(on, "a");

    // xLoc = (fract(p.x * density) - 0.5) * 2.0
    const fracPxDens = b.add(new N.Math({ op: "fract" }));
    b.connect(pxDens).to(fracPxDens, "x");
    const fracMinusHalf = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(fracPxDens).to(fracMinusHalf, "a");
    const xLoc = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(fracMinusHalf).to(xLoc, "a");
    const absXLoc = b.add(new N.Math({ op: "abs" }));
    b.connect(xLoc).to(absXLoc, "x");

    // halfW = clamp(strokeWidth, 0.001, 1) — close enough with MapRange
    const halfW = b.add(new N.MapRange({
      fromMin: 0.001, fromMax: 1, toMin: 0.001, toMax: 1, interp: "linear", clamp: true,
    }));
    b.connect(gi.strokeWidth).to(halfW, "x");
    // halfW95 = halfW * 0.95
    const halfW95 = b.add(new N.Math({ op: "mul" }), { b: 0.95 });
    b.connect(halfW).to(halfW95, "a");

    // stroke = 1 - smoothstep(halfW95, halfW, absXLoc)
    const ssStroke = b.add(new N.Smoothstep());
    b.connect(halfW95).to(ssStroke, "edge0");
    b.connect(halfW).to(ssStroke, "edge1");
    b.connect(absXLoc).to(ssStroke, "x");
    const stroke = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ssStroke).to(stroke, "x");

    // cap = 1 - smoothstep(0.95, 1.0, along)
    const ssCap = b.add(new N.Smoothstep(), { edge0: 0.95, edge1: 1 });
    b.connect(along).to(ssCap, "x");
    const cap = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ssCap).to(cap, "x");

    // rcap = mix(1, cap, rounding) = 1 + rounding * (cap - 1)
    const capMinusOne = b.add(new N.Math({ op: "sub" }), { b: 1 });
    b.connect(cap).to(capMinusOne, "a");
    const roundCapMinusOne = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.rounding).to(roundCapMinusOne, "a");
    b.connect(capMinusOne).to(roundCapMinusOne, "b");
    const rcap = b.add(new N.Math({ op: "add" }), { a: 1 });
    b.connect(roundCapMinusOne).to(rcap, "b");

    // mask = stroke * on * rcap
    const m1 = b.add(new N.Math({ op: "mul" }));
    b.connect(stroke).to(m1, "a");
    b.connect(on).to(m1, "b");
    const mask = b.add(new N.Math({ op: "mul" }));
    b.connect(m1).to(mask, "a");
    b.connect(rcap).to(mask, "b");

    // tColor = clamp(along + (balance - 0.5), 0, 1)
    const balMinusHalf = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(gi.balance).to(balMinusHalf, "a");
    const alongBal = b.add(new N.Math({ op: "add" }));
    b.connect(along).to(alongBal, "a");
    b.connect(balMinusHalf).to(alongBal, "b");
    const tColor = b.add(new N.MapRange({
      fromMin: 0, fromMax: 1, toMin: 0, toMax: 1, interp: "linear", clamp: true,
    }));
    b.connect(alongBal).to(tColor, "x");

    // color = mix(colorA, colorB, tColor)
    const color = b.add(new N.MixColor());
    b.connect(gi.colorA).to(color, "a");
    b.connect(gi.colorB).to(color, "b");
    b.connect(tColor).to(color, "t");

    // final = mix(black, color, mask) — `a` defaults to vec3(0).
    const final = b.add(new N.MixColor());
    b.connect(color).to(final, "b");
    b.connect(mask).to(final, "t");

    return b.output(final);
  }
}

register(FallingLines);
export default FallingLines;
