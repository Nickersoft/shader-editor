import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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
    const bt = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(bt, "a");
    b.connect(gi.speed).to(bt, "b");

    // Polar coords of p (centered at origin) → (r, a01)
    const zero2 = b.add(new N.CombineXy(), { x: 0, y: 0 });
    const polar = b.polarTransform(p, zero2);
    const sep = b.add(new N.SeparateXy());
    b.connect(polar).to(sep, "v");

    // ang_rad = a01 * 2π
    const angRad = b.add(new N.Math({ op: "mul" }), { b: 6.2831853 });
    b.connect(sep, "y").to(angRad, "a");

    // r0 = size * 0.45 + 0.05
    const r0a = b.add(new N.Math({ op: "mul" }), { b: 0.45 });
    b.connect(gi.size).to(r0a, "a");
    const r0 = b.add(new N.Math({ op: "add" }), { b: 0.05 });
    b.connect(r0a).to(r0, "a");

    // warp1 = sin(ang_rad * 3 + bt * 0.7 + seed) * 0.18
    const ang3 = b.add(new N.Math({ op: "mul" }), { b: 3 });
    b.connect(angRad).to(ang3, "a");
    const bt07 = b.add(new N.Math({ op: "mul" }), { b: 0.7 });
    b.connect(bt).to(bt07, "a");
    const w1arg1 = b.add(new N.Math({ op: "add" }));
    b.connect(ang3).to(w1arg1, "a");
    b.connect(bt07).to(w1arg1, "b");
    const w1arg = b.add(new N.Math({ op: "add" }));
    b.connect(w1arg1).to(w1arg, "a");
    b.connect(gi.seed).to(w1arg, "b");
    const w1sin = b.add(new N.Math({ op: "sin" }));
    b.connect(w1arg).to(w1sin, "x");
    const warp1 = b.add(new N.Math({ op: "mul" }), { b: 0.18 });
    b.connect(w1sin).to(warp1, "a");

    // warp2 = sin(ang_rad * 5 - bt * 1.1 + seed * 1.7) * 0.10
    const ang5 = b.add(new N.Math({ op: "mul" }), { b: 5 });
    b.connect(angRad).to(ang5, "a");
    const bt11 = b.add(new N.Math({ op: "mul" }), { b: 1.1 });
    b.connect(bt).to(bt11, "a");
    const seed17 = b.add(new N.Math({ op: "mul" }), { b: 1.7 });
    b.connect(gi.seed).to(seed17, "a");
    const w2arg1 = b.add(new N.Math({ op: "sub" }));
    b.connect(ang5).to(w2arg1, "a");
    b.connect(bt11).to(w2arg1, "b");
    const w2arg = b.add(new N.Math({ op: "add" }));
    b.connect(w2arg1).to(w2arg, "a");
    b.connect(seed17).to(w2arg, "b");
    const w2sin = b.add(new N.Math({ op: "sin" }));
    b.connect(w2arg).to(w2sin, "x");
    const warp2 = b.add(new N.Math({ op: "mul" }), { b: 0.1 });
    b.connect(w2sin).to(warp2, "a");

    // warp3 = fbm(vec2(cos(ang), sin(ang)) * 2 + bt*0.2 + seed) * 0.25
    const cosAng = b.add(new N.Math({ op: "cos" }));
    b.connect(angRad).to(cosAng, "x");
    const sinAng = b.add(new N.Math({ op: "sin" }));
    b.connect(angRad).to(sinAng, "x");
    const cos2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(cosAng).to(cos2, "a");
    const sin2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(sinAng).to(sin2, "a");
    const bt02 = b.add(new N.Math({ op: "mul" }), { b: 0.2 });
    b.connect(bt).to(bt02, "a");
    const offset = b.add(new N.Math({ op: "add" }));
    b.connect(bt02).to(offset, "a");
    b.connect(gi.seed).to(offset, "b");
    const fbmX = b.add(new N.Math({ op: "add" }));
    b.connect(cos2).to(fbmX, "a");
    b.connect(offset).to(fbmX, "b");
    const fbmY = b.add(new N.Math({ op: "add" }));
    b.connect(sin2).to(fbmY, "a");
    b.connect(offset).to(fbmY, "b");
    const fbmUv = b.add(new N.CombineXy());
    b.connect(fbmX).to(fbmUv, "x");
    b.connect(fbmY).to(fbmUv, "y");
    const fbmN = b.add(new N.NoiseTexture({ kind: "fbm", detail: 3, lacunarity: 2, roughness: 0.5, distortion: 0 }), { t: 0 }, );
    b.connect(fbmUv).to(fbmN, "p");
    // noise-texture (fbm) outputs in [0,1]; bring back to [-1,1] so the warp
    // keeps its bidirectional shape.
    const fbm2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(fbmN).to(fbm2, "a");
    const fbmSigned = b.add(new N.Math({ op: "sub" }), { b: 1 });
    b.connect(fbm2).to(fbmSigned, "a");
    const warp3 = b.add(new N.Math({ op: "mul" }), { b: 0.25 });
    b.connect(fbmSigned).to(warp3, "a");

    // warp = warp1 + warp2 + warp3
    const warpAB = b.add(new N.Math({ op: "add" }));
    b.connect(warp1).to(warpAB, "a");
    b.connect(warp2).to(warpAB, "b");
    const warp = b.add(new N.Math({ op: "add" }));
    b.connect(warpAB).to(warp, "a");
    b.connect(warp3).to(warp, "b");

    // rad = r0 * (1 + warp * def)
    const wdef = b.add(new N.Math({ op: "mul" }));
    b.connect(warp).to(wdef, "a");
    b.connect(gi.deformation).to(wdef, "b");
    const oneWdef = b.add(new N.Math({ op: "add" }), { a: 1 });
    b.connect(wdef).to(oneWdef, "b");
    const rad = b.add(new N.Math({ op: "mul" }));
    b.connect(r0).to(rad, "a");
    b.connect(oneWdef).to(rad, "b");

    // d = r - rad
    const r = { nodeId: sep.nodeId, pin: "x" };
    const d = b.add(new N.Math({ op: "sub" }));
    b.connect(r).to(d, "a");
    b.connect(rad).to(d, "b");

    // edge = mix(0.005, 0.20, softness) → MapRange softness [0,1] → [0.005, 0.20]
    const edge = b.add(new N.MapRange({
      fromMin: 0,
      fromMax: 1,
      toMin: 0.005,
      toMax: 0.2,
      interp: "linear",
      clamp: true,
    }));
    b.connect(gi.softness).to(edge, "x");
    const negEdge = b.add(new N.Math({ op: "neg" }));
    b.connect(edge).to(negEdge, "x");

    // mask = 1 - smoothstep(-edge, +edge, d)
    const ss = b.add(new N.Smoothstep());
    b.connect(negEdge).to(ss, "edge0");
    b.connect(edge).to(ss, "edge1");
    b.connect(d).to(ss, "x");
    const mask = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(mask, "x");

    // fill = clamp(r / rad, 0, 1) → MapRange clamp pass-through
    const ratio = b.add(new N.Math({ op: "div" }));
    b.connect(r).to(ratio, "a");
    b.connect(rad).to(ratio, "b");
    const fill = b.add(new N.MapRange({
      fromMin: 0,
      fromMax: 1,
      toMin: 0,
      toMax: 1,
      interp: "linear",
      clamp: true,
    }));
    b.connect(ratio).to(fill, "x");

    // bg = mix(colorA, colorB, fill)
    const bg = b.add(new N.MixColor());
    b.connect(gi.colorA).to(bg, "a");
    b.connect(gi.colorB).to(bg, "b");
    b.connect(fill).to(bg, "t");

    // out = mix(black, bg, mask) — `a` defaults to vec3(0) so no wiring
    // needed for the black side.
    const out = b.add(new N.MixColor());
    b.connect(bg).to(out, "b");
    b.connect(mask).to(out, "t");
    return b.output(out);
  }
}

register(Blob);
export default Blob;
