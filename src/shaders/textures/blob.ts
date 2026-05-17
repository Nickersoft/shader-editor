import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Blob",
  description: "Animated organic blob",
  color: "#ff6b35",
  category: "textures",
  defaultBlendMode: "normal",
};

// Decomposed blob: polar `r,θ` → warped radius via 3 sines + fbm → SDF mask
// → ramp the interior fill, mix onto black. The legacy field-stage's
// dFdx-based 3D-lit highlight is intentionally dropped — derivatives don't
// have a pure node-graph equivalent without an fwidth primitive. Users who
// want a lit blob can fork the graph and add their own normal calculation;
// the loss of the cheap fake-3D highlight is the price for full editability.
export class Blob extends ProceduralShader {
  static readonly typeId = "blob";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
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
    const bt = b.add("math", { op: "mul" });
    b.connect(t, bt.nodeId, "a");
    b.connect(gi.speed, bt.nodeId, "b");

    // Polar coords of p (centered at origin) → (r, a01)
    const zero2 = b.add("combine-xy", {}, { x: 0, y: 0 });
    const polar = b.polarTransform(p, zero2);
    const sep = b.add("separate-xy", {});
    b.connect(polar, sep.nodeId, "v");

    // ang_rad = a01 * 2π
    const angRad = b.add("math", { op: "mul" }, { b: 6.2831853 });
    b.connect({ nodeId: sep.nodeId, pin: "y" }, angRad.nodeId, "a");

    // r0 = size * 0.45 + 0.05
    const r0a = b.add("math", { op: "mul" }, { b: 0.45 });
    b.connect(gi.size, r0a.nodeId, "a");
    const r0 = b.add("math", { op: "add" }, { b: 0.05 });
    b.connect(r0a, r0.nodeId, "a");

    // warp1 = sin(ang_rad * 3 + bt * 0.7 + seed) * 0.18
    const ang3 = b.add("math", { op: "mul" }, { b: 3 });
    b.connect(angRad, ang3.nodeId, "a");
    const bt07 = b.add("math", { op: "mul" }, { b: 0.7 });
    b.connect(bt, bt07.nodeId, "a");
    const w1arg1 = b.add("math", { op: "add" });
    b.connect(ang3, w1arg1.nodeId, "a");
    b.connect(bt07, w1arg1.nodeId, "b");
    const w1arg = b.add("math", { op: "add" });
    b.connect(w1arg1, w1arg.nodeId, "a");
    b.connect(gi.seed, w1arg.nodeId, "b");
    const w1sin = b.add("math", { op: "sin" });
    b.connect(w1arg, w1sin.nodeId, "x");
    const warp1 = b.add("math", { op: "mul" }, { b: 0.18 });
    b.connect(w1sin, warp1.nodeId, "a");

    // warp2 = sin(ang_rad * 5 - bt * 1.1 + seed * 1.7) * 0.10
    const ang5 = b.add("math", { op: "mul" }, { b: 5 });
    b.connect(angRad, ang5.nodeId, "a");
    const bt11 = b.add("math", { op: "mul" }, { b: 1.1 });
    b.connect(bt, bt11.nodeId, "a");
    const seed17 = b.add("math", { op: "mul" }, { b: 1.7 });
    b.connect(gi.seed, seed17.nodeId, "a");
    const w2arg1 = b.add("math", { op: "sub" });
    b.connect(ang5, w2arg1.nodeId, "a");
    b.connect(bt11, w2arg1.nodeId, "b");
    const w2arg = b.add("math", { op: "add" });
    b.connect(w2arg1, w2arg.nodeId, "a");
    b.connect(seed17, w2arg.nodeId, "b");
    const w2sin = b.add("math", { op: "sin" });
    b.connect(w2arg, w2sin.nodeId, "x");
    const warp2 = b.add("math", { op: "mul" }, { b: 0.1 });
    b.connect(w2sin, warp2.nodeId, "a");

    // warp3 = fbm(vec2(cos(ang), sin(ang)) * 2 + bt*0.2 + seed) * 0.25
    const cosAng = b.add("math", { op: "cos" });
    b.connect(angRad, cosAng.nodeId, "x");
    const sinAng = b.add("math", { op: "sin" });
    b.connect(angRad, sinAng.nodeId, "x");
    const cos2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(cosAng, cos2.nodeId, "a");
    const sin2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(sinAng, sin2.nodeId, "a");
    const bt02 = b.add("math", { op: "mul" }, { b: 0.2 });
    b.connect(bt, bt02.nodeId, "a");
    const offset = b.add("math", { op: "add" });
    b.connect(bt02, offset.nodeId, "a");
    b.connect(gi.seed, offset.nodeId, "b");
    const fbmX = b.add("math", { op: "add" });
    b.connect(cos2, fbmX.nodeId, "a");
    b.connect(offset, fbmX.nodeId, "b");
    const fbmY = b.add("math", { op: "add" });
    b.connect(sin2, fbmY.nodeId, "a");
    b.connect(offset, fbmY.nodeId, "b");
    const fbmUv = b.add("combine-xy", {});
    b.connect(fbmX, fbmUv.nodeId, "x");
    b.connect(fbmY, fbmUv.nodeId, "y");
    const fbmN = b.add(
      "noise-texture",
      { kind: "fbm", detail: 3, lacunarity: 2, roughness: 0.5, distortion: 0 },
      { t: 0 },
    );
    b.connect(fbmUv, fbmN.nodeId, "p");
    // noise-texture (fbm) outputs in [0,1]; bring back to [-1,1] so the warp
    // keeps its bidirectional shape.
    const fbm2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(fbmN, fbm2.nodeId, "a");
    const fbmSigned = b.add("math", { op: "sub" }, { b: 1 });
    b.connect(fbm2, fbmSigned.nodeId, "a");
    const warp3 = b.add("math", { op: "mul" }, { b: 0.25 });
    b.connect(fbmSigned, warp3.nodeId, "a");

    // warp = warp1 + warp2 + warp3
    const warpAB = b.add("math", { op: "add" });
    b.connect(warp1, warpAB.nodeId, "a");
    b.connect(warp2, warpAB.nodeId, "b");
    const warp = b.add("math", { op: "add" });
    b.connect(warpAB, warp.nodeId, "a");
    b.connect(warp3, warp.nodeId, "b");

    // rad = r0 * (1 + warp * def)
    const wdef = b.add("math", { op: "mul" });
    b.connect(warp, wdef.nodeId, "a");
    b.connect(gi.deformation, wdef.nodeId, "b");
    const oneWdef = b.add("math", { op: "add" }, { a: 1 });
    b.connect(wdef, oneWdef.nodeId, "b");
    const rad = b.add("math", { op: "mul" });
    b.connect(r0, rad.nodeId, "a");
    b.connect(oneWdef, rad.nodeId, "b");

    // d = r - rad
    const r = { nodeId: sep.nodeId, pin: "x" };
    const d = b.add("math", { op: "sub" });
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

    // fill = clamp(r / rad, 0, 1) → MapRange clamp pass-through
    const ratio = b.add("math", { op: "div" });
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

    // out = mix(black, bg, mask) — `a` defaults to vec3(0) so no wiring
    // needed for the black side.
    const out = b.add("mix-color", {});
    b.connect(bg, out.nodeId, "b");
    b.connect(mask, out.nodeId, "t");
    return b.output(out);
  }
}

register(Blob);
export default Blob;
