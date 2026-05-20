// Perspective — graph-decomposed. The legacy effect uses mat3 rotations in
// vec3 space (rotate around Y, then around X, then perspective-project
// back to vec2). There's no mat3 primitive yet, so we expand the two
// rotations into their component vec3 multiply-adds, then divide by z.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Perspective",
  description: "Rotate the plane in 3D space with pan, tilt, and FOV",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Perspective extends ProceduralEffect {
  static readonly typeId = "perspective";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "panX", type: "float", label: "Pan X", default: 0 },
      { id: "panY", type: "float", label: "Pan Y", default: 0 },
      { id: "tiltX", type: "float", label: "Tilt X", default: 0 },
      { id: "tiltY", type: "float", label: "Tilt Y", default: 0 },
      { id: "fov", type: "float", label: "FOV", default: 60 },
      { id: "offsetX", type: "float", label: "Offset X", default: 0 },
      { id: "offsetY", type: "float", label: "Offset Y", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // p.xy = (uv − 0.5 − offset) · 2 · fovScale; p.z = fovScale
    const offset = b.add(new N.CombineXy());
    b.connect(gi.offsetX).to(offset, "x");
    b.connect(gi.offsetY).to(offset, "y");
    const half = b.add(new N.Const({ value: 0.5 }));
    const halfV = b.add(new N.CombineXy());
    b.connect(half).to(halfV, "x");
    b.connect(half).to(halfV, "y");
    const cent = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(cent, "a");
    b.connect(halfV).to(cent, "b");
    const adj = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(cent).to(adj, "a");
    b.connect(offset).to(adj, "b");
    const adj2 = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(adj).to(adj2, "a");
    b.connect(b.add(new N.Const({ value: 2 }))).to(adj2, "b");

    // fovScale = 1 / tan(fov · 0.5 · π/180)
    const fovHalfDeg = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(gi.fov).to(fovHalfDeg, "a");
    const fovHalfRad = b.add(new N.Math({ op: "to-radians" }));
    b.connect(fovHalfDeg).to(fovHalfRad, "x");
    const tanH = b.add(new N.Math({ op: "tan" }));
    b.connect(fovHalfRad).to(tanH, "x");
    const fovScale = b.add(new N.Math({ op: "div" }), { a: 1 });
    b.connect(tanH).to(fovScale, "b");
    const pxy = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(adj2).to(pxy, "a");
    b.connect(fovScale).to(pxy, "b");

    // Decompose into x, y, z.
    const sepP = b.add(new N.SeparateXy());
    b.connect(pxy).to(sepP, "v");
    const px = { nodeId: sepP.nodeId, pin: "x" };
    const py = { nodeId: sepP.nodeId, pin: "y" };
    // z = fovScale
    const pz = fovScale;

    // ay = tiltX (around Y); ax = tiltY (around X)
    const cosY = b.add(new N.Math({ op: "cos" }));
    b.connect(gi.tiltX).to(cosY, "x");
    const sinY = b.add(new N.Math({ op: "sin" }));
    b.connect(gi.tiltX).to(sinY, "x");
    const cosX = b.add(new N.Math({ op: "cos" }));
    b.connect(gi.tiltY).to(cosX, "x");
    const sinX = b.add(new N.Math({ op: "sin" }));
    b.connect(gi.tiltY).to(sinX, "x");

    // After ry: x' = cy·x − sy·z; y' = y; z' = sy·x + cy·z
    const cyx = b.add(new N.Math({ op: "mul" }));
    b.connect(cosY).to(cyx, "a");
    b.connect(px).to(cyx, "b");
    const syz = b.add(new N.Math({ op: "mul" }));
    b.connect(sinY).to(syz, "a");
    b.connect(pz).to(syz, "b");
    const x1 = b.add(new N.Math({ op: "sub" }));
    b.connect(cyx).to(x1, "a");
    b.connect(syz).to(x1, "b");
    const y1 = py;
    const syx = b.add(new N.Math({ op: "mul" }));
    b.connect(sinY).to(syx, "a");
    b.connect(px).to(syx, "b");
    const cyz = b.add(new N.Math({ op: "mul" }));
    b.connect(cosY).to(cyz, "a");
    b.connect(pz).to(cyz, "b");
    const z1 = b.add(new N.Math({ op: "add" }));
    b.connect(syx).to(z1, "a");
    b.connect(cyz).to(z1, "b");

    // After rx: x'' = x'; y'' = cx·y + sx·z; z'' = -sx·y + cx·z
    const x2 = x1;
    const cxy = b.add(new N.Math({ op: "mul" }));
    b.connect(cosX).to(cxy, "a");
    b.connect(y1).to(cxy, "b");
    const sxz = b.add(new N.Math({ op: "mul" }));
    b.connect(sinX).to(sxz, "a");
    b.connect(z1).to(sxz, "b");
    const y2 = b.add(new N.Math({ op: "add" }));
    b.connect(cxy).to(y2, "a");
    b.connect(sxz).to(y2, "b");
    const sxy = b.add(new N.Math({ op: "mul" }));
    b.connect(sinX).to(sxy, "a");
    b.connect(y1).to(sxy, "b");
    const cxz = b.add(new N.Math({ op: "mul" }));
    b.connect(cosX).to(cxz, "a");
    b.connect(z1).to(cxz, "b");
    const z2 = b.add(new N.Math({ op: "sub" }));
    b.connect(cxz).to(z2, "a");
    b.connect(sxy).to(z2, "b");

    // finalUV = (x2, y2) / max(z2, 0.001) · 0.5 + 0.5 + pan
    const zSafe = b.add(new N.Math({ op: "max" }), { b: 0.001 });
    b.connect(z2).to(zSafe, "a");
    const xn = b.add(new N.Math({ op: "div" }));
    b.connect(x2).to(xn, "a");
    b.connect(zSafe).to(xn, "b");
    const yn = b.add(new N.Math({ op: "div" }));
    b.connect(y2).to(yn, "a");
    b.connect(zSafe).to(yn, "b");
    const xn5 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(xn).to(xn5, "a");
    const yn5 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(yn).to(yn5, "a");
    const xn55 = b.add(new N.Math({ op: "add" }), { b: 0.5 });
    b.connect(xn5).to(xn55, "a");
    const yn55 = b.add(new N.Math({ op: "add" }), { b: 0.5 });
    b.connect(yn5).to(yn55, "a");
    const fx = b.add(new N.Math({ op: "add" }));
    b.connect(xn55).to(fx, "a");
    b.connect(gi.panX).to(fx, "b");
    const fy = b.add(new N.Math({ op: "add" }));
    b.connect(yn55).to(fy, "a");
    b.connect(gi.panY).to(fy, "b");
    const finalUv = b.add(new N.CombineXy());
    b.connect(fx).to(finalUv, "x");
    b.connect(fy).to(finalUv, "y");

    const sample = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Perspective);
export default Perspective;
