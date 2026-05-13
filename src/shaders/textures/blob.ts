import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

// Decomposed blob: polar `r,θ` → warped radius via 3 sines + fbm → SDF mask
// → ramp the interior fill, mix onto black. The legacy field-stage's
// dFdx-based 3D-lit highlight is intentionally dropped — derivatives don't
// have a pure node-graph equivalent without an fwidth primitive. Users who
// want a lit blob can fork the graph and add their own normal calculation;
// the loss of the cheap fake-3D highlight is the price for full editability.
export default {
  id: "blob",
  name: "Blob",
  description: "Animated organic blob — Procedural Field preset",
  color: "#ff6b35",
  graph: () => {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "size", type: "float", label: "Size", default: 0.5 },
      { id: "deformation", type: "float", label: "Deformation", default: 0.5 },
      { id: "softness", type: "float", label: "Softness", default: 0.5 },
      { id: "speed", type: "float", label: "Speed", default: 0.5 },
      { id: "seed", type: "float", label: "Seed", default: 1 },
      { id: "colorA", type: "vec3", label: "Color A", default: [1.0, 0.42, 0.21] },
      { id: "colorB", type: "vec3", label: "Color B", default: [0.91, 0.12, 0.39] },
    ]);
    const p = b.position();
    const t = b.time();

    // bt = t * speed
    const bt = b.add("combine", { op: "mul" });
    b.connect(t, bt.nodeId, "a");
    b.connect(gi.speed, bt.nodeId, "b");

    // Polar coords of p (centered at origin) → (r, a01)
    const zero = b.add("const", { value: 0 });
    const zero2 = b.add("combine-xy", {});
    b.connect(zero, zero2.nodeId, "x");
    b.connect(zero, zero2.nodeId, "y");
    const polar = b.add("polar-transform", {});
    b.connect(p, polar.nodeId, "p");
    b.connect(zero2, polar.nodeId, "center");
    const sep = b.add("separate-xy", {});
    b.connect(polar, sep.nodeId, "v");

    // ang_rad = a01 * 2π
    const tau = b.add("const", { value: 6.2831853 });
    const angRad = b.add("combine", { op: "mul" });
    b.connect({ nodeId: sep.nodeId, pin: "y" }, angRad.nodeId, "a");
    b.connect(tau, angRad.nodeId, "b");

    // r0 = size * 0.45 + 0.05
    const k045 = b.add("const", { value: 0.45 });
    const k005 = b.add("const", { value: 0.05 });
    const r0a = b.add("combine", { op: "mul" });
    b.connect(gi.size, r0a.nodeId, "a");
    b.connect(k045, r0a.nodeId, "b");
    const r0 = b.add("combine", { op: "add" });
    b.connect(r0a, r0.nodeId, "a");
    b.connect(k005, r0.nodeId, "b");

    // warp1 = sin(ang_rad * 3 + bt * 0.7 + seed) * 0.18
    const k3 = b.add("const", { value: 3 });
    const k07 = b.add("const", { value: 0.7 });
    const k018 = b.add("const", { value: 0.18 });
    const ang3 = b.add("combine", { op: "mul" });
    b.connect(angRad, ang3.nodeId, "a");
    b.connect(k3, ang3.nodeId, "b");
    const bt07 = b.add("combine", { op: "mul" });
    b.connect(bt, bt07.nodeId, "a");
    b.connect(k07, bt07.nodeId, "b");
    const w1arg1 = b.add("combine", { op: "add" });
    b.connect(ang3, w1arg1.nodeId, "a");
    b.connect(bt07, w1arg1.nodeId, "b");
    const w1arg = b.add("combine", { op: "add" });
    b.connect(w1arg1, w1arg.nodeId, "a");
    b.connect(gi.seed, w1arg.nodeId, "b");
    const w1sin = b.add("math", { op: "sin" });
    b.connect(w1arg, w1sin.nodeId, "x");
    const warp1 = b.add("combine", { op: "mul" });
    b.connect(w1sin, warp1.nodeId, "a");
    b.connect(k018, warp1.nodeId, "b");

    // warp2 = sin(ang_rad * 5 - bt * 1.1 + seed * 1.7) * 0.10
    const k5 = b.add("const", { value: 5 });
    const k11 = b.add("const", { value: 1.1 });
    const k17 = b.add("const", { value: 1.7 });
    const k010 = b.add("const", { value: 0.10 });
    const ang5 = b.add("combine", { op: "mul" });
    b.connect(angRad, ang5.nodeId, "a");
    b.connect(k5, ang5.nodeId, "b");
    const bt11 = b.add("combine", { op: "mul" });
    b.connect(bt, bt11.nodeId, "a");
    b.connect(k11, bt11.nodeId, "b");
    const seed17 = b.add("combine", { op: "mul" });
    b.connect(gi.seed, seed17.nodeId, "a");
    b.connect(k17, seed17.nodeId, "b");
    const w2arg1 = b.add("combine", { op: "sub" });
    b.connect(ang5, w2arg1.nodeId, "a");
    b.connect(bt11, w2arg1.nodeId, "b");
    const w2arg = b.add("combine", { op: "add" });
    b.connect(w2arg1, w2arg.nodeId, "a");
    b.connect(seed17, w2arg.nodeId, "b");
    const w2sin = b.add("math", { op: "sin" });
    b.connect(w2arg, w2sin.nodeId, "x");
    const warp2 = b.add("combine", { op: "mul" });
    b.connect(w2sin, warp2.nodeId, "a");
    b.connect(k010, warp2.nodeId, "b");

    // warp3 = fbm(vec2(cos(ang), sin(ang)) * 2 + bt*0.2 + seed) * 0.25
    const k2 = b.add("const", { value: 2 });
    const k02 = b.add("const", { value: 0.2 });
    const k025 = b.add("const", { value: 0.25 });
    const cosAng = b.add("math", { op: "cos" });
    b.connect(angRad, cosAng.nodeId, "x");
    const sinAng = b.add("math", { op: "sin" });
    b.connect(angRad, sinAng.nodeId, "x");
    const cos2 = b.add("combine", { op: "mul" });
    b.connect(cosAng, cos2.nodeId, "a");
    b.connect(k2, cos2.nodeId, "b");
    const sin2 = b.add("combine", { op: "mul" });
    b.connect(sinAng, sin2.nodeId, "a");
    b.connect(k2, sin2.nodeId, "b");
    const bt02 = b.add("combine", { op: "mul" });
    b.connect(bt, bt02.nodeId, "a");
    b.connect(k02, bt02.nodeId, "b");
    const offset = b.add("combine", { op: "add" });
    b.connect(bt02, offset.nodeId, "a");
    b.connect(gi.seed, offset.nodeId, "b");
    const fbmX = b.add("combine", { op: "add" });
    b.connect(cos2, fbmX.nodeId, "a");
    b.connect(offset, fbmX.nodeId, "b");
    const fbmY = b.add("combine", { op: "add" });
    b.connect(sin2, fbmY.nodeId, "a");
    b.connect(offset, fbmY.nodeId, "b");
    const fbmUv = b.add("combine-xy", {});
    b.connect(fbmX, fbmUv.nodeId, "x");
    b.connect(fbmY, fbmUv.nodeId, "y");
    const tZero = b.add("const", { value: 0 });
    const fbmN = b.add("fbm-sample", { detail: 3, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(fbmUv, fbmN.nodeId, "p");
    b.connect(tZero, fbmN.nodeId, "t");
    // fbm-sample outputs in [0,1] (it has a +0.5 remap). Bring back to [-1,1]
    // so the warp keeps its bidirectional shape.
    const k2x = b.add("const", { value: 2 });
    const kNeg1 = b.add("const", { value: -1 });
    const fbm2 = b.add("combine", { op: "mul" });
    b.connect(fbmN, fbm2.nodeId, "a");
    b.connect(k2x, fbm2.nodeId, "b");
    const fbmSigned = b.add("combine", { op: "add" });
    b.connect(fbm2, fbmSigned.nodeId, "a");
    b.connect(kNeg1, fbmSigned.nodeId, "b");
    const warp3 = b.add("combine", { op: "mul" });
    b.connect(fbmSigned, warp3.nodeId, "a");
    b.connect(k025, warp3.nodeId, "b");

    // warp = warp1 + warp2 + warp3
    const warpAB = b.add("combine", { op: "add" });
    b.connect(warp1, warpAB.nodeId, "a");
    b.connect(warp2, warpAB.nodeId, "b");
    const warp = b.add("combine", { op: "add" });
    b.connect(warpAB, warp.nodeId, "a");
    b.connect(warp3, warp.nodeId, "b");

    // rad = r0 * (1 + warp * def)
    const k1 = b.add("const", { value: 1 });
    const wdef = b.add("combine", { op: "mul" });
    b.connect(warp, wdef.nodeId, "a");
    b.connect(gi.deformation, wdef.nodeId, "b");
    const oneWdef = b.add("combine", { op: "add" });
    b.connect(k1, oneWdef.nodeId, "a");
    b.connect(wdef, oneWdef.nodeId, "b");
    const rad = b.add("combine", { op: "mul" });
    b.connect(r0, rad.nodeId, "a");
    b.connect(oneWdef, rad.nodeId, "b");

    // d = r - rad
    const r = { nodeId: sep.nodeId, pin: "x" };
    const d = b.add("combine", { op: "sub" });
    b.connect(r, d.nodeId, "a");
    b.connect(rad, d.nodeId, "b");

    // edge = mix(0.005, 0.20, softness) → MapRange softness [0,1] → [0.005, 0.20]
    const edge = b.add("map-range", {
      fromMin: 0,
      fromMax: 1,
      toMin: 0.005,
      toMax: 0.2,
      interp: "linear",
      clamp: true,
    });
    b.connect(gi.softness, edge.nodeId, "x");
    const negEdge = b.add("math", { op: "neg" });
    b.connect(edge, negEdge.nodeId, "x");

    // mask = 1 - smoothstep(-edge, +edge, d)
    const ss = b.add("smoothstep", {});
    b.connect(negEdge, ss.nodeId, "edge0");
    b.connect(edge, ss.nodeId, "edge1");
    b.connect(d, ss.nodeId, "x");
    const mask = b.add("math", { op: "oneminus" });
    b.connect(ss, mask.nodeId, "x");

    // fill = clamp(r / rad, 0, 1) → Combine div + MapRange clamp pass-through
    const ratio = b.add("combine", { op: "div" });
    b.connect(r, ratio.nodeId, "a");
    b.connect(rad, ratio.nodeId, "b");
    const fill = b.add("map-range", {
      fromMin: 0,
      fromMax: 1,
      toMin: 0,
      toMax: 1,
      interp: "linear",
      clamp: true,
    });
    b.connect(ratio, fill.nodeId, "x");

    // bg = mix(colorA, colorB, fill)
    const bg = b.add("mix-color", {});
    b.connect(gi.colorA, bg.nodeId, "a");
    b.connect(gi.colorB, bg.nodeId, "b");
    b.connect(fill, bg.nodeId, "t");

    // out = mix(black, bg, mask)
    const black = b.add("mix-color", {});
    const kz = b.add("const", { value: 0 });
    // mix-color default a = (0,0,0); using bg as both lets us reuse a black
    // by leaving b=default. Simpler path: literal-zero ColorRamp.
    const blackRamp = b.colorRamp(kz, [
      [0, 0, 0],
      [0, 0, 0],
    ]);
    b.connect(blackRamp, black.nodeId, "a");
    b.connect(bg, black.nodeId, "b");
    b.connect(mask, black.nodeId, "t");
    return b.output(black);
  },
} satisfies ProceduralPreset;
