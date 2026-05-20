// Form3D — graph-decomposed pseudo-3D pan/tilt projection.
//   p = uv − c
//   p *= tan(fov · π/360)
//   denomY = 1 + p.x · tan(pan)
//   warpedY = p.y / max(denomY, ε)
//   denomX = 1 + warpedY · tan(tilt)
//   warpedX = p.x / max(denomX, ε)
//   finalUV = vec2(warpedX, warpedY) + c

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Form 3D",
  description: "Pseudo-3D pan/tilt projection",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Form3D extends ProceduralEffect {
  static readonly typeId = "form3d";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "pan", type: "float", label: "Pan (deg)", default: 0 },
      { id: "tilt", type: "float", label: "Tilt (deg)", default: 0 },
      { id: "fov", type: "float", label: "FOV (deg)", default: 60 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const c = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(c, "x");
    b.connect(gi.centerY).to(c, "y");

    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const deg360 = b.add(new N.Const({ value: Math.PI / 360 }));
    const eps = b.add(new N.Const({ value: 0.001 }));

    const panR = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.pan).to(panR, "a");
    b.connect(deg2rad).to(panR, "b");
    const tiltR = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.tilt).to(tiltR, "a");
    b.connect(deg2rad).to(tiltR, "b");
    const halfFov = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.fov).to(halfFov, "a");
    b.connect(deg360).to(halfFov, "b");

    const fovScale = b.add(new N.Math({ op: "tan" }));
    b.connect(halfFov).to(fovScale, "x");
    const tanPan = b.add(new N.Math({ op: "tan" }));
    b.connect(panR).to(tanPan, "x");
    const tanTilt = b.add(new N.Math({ op: "tan" }));
    b.connect(tiltR).to(tanTilt, "x");

    const dCenter = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(dCenter, "a");
    b.connect(c).to(dCenter, "b");
    const p = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dCenter).to(p, "a");
    b.connect(fovScale).to(p, "b");

    const split = b.add(new N.SeparateXy());
    b.connect(p).to(split, "v");
    const px = { nodeId: split.nodeId, pin: "x" };
    const py = { nodeId: split.nodeId, pin: "y" };

    // denomY = 1 + p.x · tan(pan)
    const one = b.add(new N.Const({ value: 1 }));
    const pxTan = b.add(new N.Math({ op: "mul" }));
    b.connect(px).to(pxTan, "a");
    b.connect(tanPan).to(pxTan, "b");
    const denomY = b.add(new N.Math({ op: "add" }));
    b.connect(one).to(denomY, "a");
    b.connect(pxTan).to(denomY, "b");
    const safeDenomY = b.add(new N.Math({ op: "max" }));
    b.connect(denomY).to(safeDenomY, "a");
    b.connect(eps).to(safeDenomY, "b");
    const warpedY = b.add(new N.Math({ op: "div" }));
    b.connect(py).to(warpedY, "a");
    b.connect(safeDenomY).to(warpedY, "b");

    const wyTan = b.add(new N.Math({ op: "mul" }));
    b.connect(warpedY).to(wyTan, "a");
    b.connect(tanTilt).to(wyTan, "b");
    const denomX = b.add(new N.Math({ op: "add" }));
    b.connect(one).to(denomX, "a");
    b.connect(wyTan).to(denomX, "b");
    const safeDenomX = b.add(new N.Math({ op: "max" }));
    b.connect(denomX).to(safeDenomX, "a");
    b.connect(eps).to(safeDenomX, "b");
    const warpedX = b.add(new N.Math({ op: "div" }));
    b.connect(px).to(warpedX, "a");
    b.connect(safeDenomX).to(warpedX, "b");

    const warped = b.add(new N.CombineXy());
    b.connect(warpedX).to(warped, "x");
    b.connect(warpedY).to(warped, "y");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(warped).to(finalUv, "a");
    b.connect(c).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Form3D);
export default Form3D;
