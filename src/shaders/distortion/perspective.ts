// Perspective — graph-decomposed. The legacy effect uses mat3 rotations in
// vec3 space (rotate around Y, then around X, then perspective-project
// back to vec2). There's no mat3 primitive yet, so we expand the two
// rotations into their component vec3 multiply-adds, then divide by z.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Perspective",
  description: "Rotate the plane in 3D space with pan, tilt, and FOV",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Perspective extends GraphEffectBase {
  static readonly typeId = "perspective";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "panX", type: "float", label: "Pan X", default: 0 },
      { id: "panY", type: "float", label: "Pan Y", default: 0 },
      { id: "tiltX", type: "float", label: "Tilt X", default: 0 },
      { id: "tiltY", type: "float", label: "Tilt Y", default: 0 },
      { id: "fov", type: "float", label: "FOV", default: 60 },
      { id: "offsetX", type: "float", label: "Offset X", default: 0 },
      { id: "offsetY", type: "float", label: "Offset Y", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // p.xy = (uv − 0.5 − offset) · 2 · fovScale; p.z = fovScale
    const offset = b.add("combine-xy", {});
    b.connect(gi.offsetX, offset.nodeId, "x");
    b.connect(gi.offsetY, offset.nodeId, "y");
    const half = b.add("value", { value: 0.5 });
    const halfV = b.add("combine-xy", {});
    b.connect(half, halfV.nodeId, "x");
    b.connect(half, halfV.nodeId, "y");
    const cent = b.add("vector-math", { op: "sub" });
    b.connect(uv, cent.nodeId, "a");
    b.connect(halfV, cent.nodeId, "b");
    const adj = b.add("vector-math", { op: "sub" });
    b.connect(cent, adj.nodeId, "a");
    b.connect(offset, adj.nodeId, "b");
    const adj2 = b.add("vector-math", { op: "scale" });
    b.connect(adj, adj2.nodeId, "a");
    b.connect(b.add("value", { value: 2 }), adj2.nodeId, "b");

    // fovScale = 1 / tan(fov · 0.5 · π/180)
    const fovHalfDeg = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gi.fov, fovHalfDeg.nodeId, "a");
    const fovHalfRad = b.add("math", { op: "to-radians" });
    b.connect(fovHalfDeg, fovHalfRad.nodeId, "x");
    const tanH = b.add("math", { op: "tan" });
    b.connect(fovHalfRad, tanH.nodeId, "x");
    const fovScale = b.add("math", { op: "div" }, { a: 1 });
    b.connect(tanH, fovScale.nodeId, "b");
    const pxy = b.add("vector-math", { op: "scale" });
    b.connect(adj2, pxy.nodeId, "a");
    b.connect(fovScale, pxy.nodeId, "b");

    // Decompose into x, y, z.
    const sepP = b.add("separate-xy", {});
    b.connect(pxy, sepP.nodeId, "v");
    const px = { nodeId: sepP.nodeId, pin: "x" };
    const py = { nodeId: sepP.nodeId, pin: "y" };
    // z = fovScale
    const pz = fovScale;

    // ay = tiltX (around Y); ax = tiltY (around X)
    const cosY = b.add("math", { op: "cos" });
    b.connect(gi.tiltX, cosY.nodeId, "x");
    const sinY = b.add("math", { op: "sin" });
    b.connect(gi.tiltX, sinY.nodeId, "x");
    const cosX = b.add("math", { op: "cos" });
    b.connect(gi.tiltY, cosX.nodeId, "x");
    const sinX = b.add("math", { op: "sin" });
    b.connect(gi.tiltY, sinX.nodeId, "x");

    // After ry: x' = cy·x − sy·z; y' = y; z' = sy·x + cy·z
    const cyx = b.add("math", { op: "mul" });
    b.connect(cosY, cyx.nodeId, "a");
    b.connect(px, cyx.nodeId, "b");
    const syz = b.add("math", { op: "mul" });
    b.connect(sinY, syz.nodeId, "a");
    b.connect(pz, syz.nodeId, "b");
    const x1 = b.add("math", { op: "sub" });
    b.connect(cyx, x1.nodeId, "a");
    b.connect(syz, x1.nodeId, "b");
    const y1 = py;
    const syx = b.add("math", { op: "mul" });
    b.connect(sinY, syx.nodeId, "a");
    b.connect(px, syx.nodeId, "b");
    const cyz = b.add("math", { op: "mul" });
    b.connect(cosY, cyz.nodeId, "a");
    b.connect(pz, cyz.nodeId, "b");
    const z1 = b.add("math", { op: "add" });
    b.connect(syx, z1.nodeId, "a");
    b.connect(cyz, z1.nodeId, "b");

    // After rx: x'' = x'; y'' = cx·y + sx·z; z'' = -sx·y + cx·z
    const x2 = x1;
    const cxy = b.add("math", { op: "mul" });
    b.connect(cosX, cxy.nodeId, "a");
    b.connect(y1, cxy.nodeId, "b");
    const sxz = b.add("math", { op: "mul" });
    b.connect(sinX, sxz.nodeId, "a");
    b.connect(z1, sxz.nodeId, "b");
    const y2 = b.add("math", { op: "add" });
    b.connect(cxy, y2.nodeId, "a");
    b.connect(sxz, y2.nodeId, "b");
    const sxy = b.add("math", { op: "mul" });
    b.connect(sinX, sxy.nodeId, "a");
    b.connect(y1, sxy.nodeId, "b");
    const cxz = b.add("math", { op: "mul" });
    b.connect(cosX, cxz.nodeId, "a");
    b.connect(z1, cxz.nodeId, "b");
    const z2 = b.add("math", { op: "sub" });
    b.connect(cxz, z2.nodeId, "a");
    b.connect(sxy, z2.nodeId, "b");

    // finalUV = (x2, y2) / max(z2, 0.001) · 0.5 + 0.5 + pan
    const zSafe = b.add("math", { op: "max" }, { b: 0.001 });
    b.connect(z2, zSafe.nodeId, "a");
    const xn = b.add("math", { op: "div" });
    b.connect(x2, xn.nodeId, "a");
    b.connect(zSafe, xn.nodeId, "b");
    const yn = b.add("math", { op: "div" });
    b.connect(y2, yn.nodeId, "a");
    b.connect(zSafe, yn.nodeId, "b");
    const xn5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(xn, xn5.nodeId, "a");
    const yn5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(yn, yn5.nodeId, "a");
    const xn55 = b.add("math", { op: "add" }, { b: 0.5 });
    b.connect(xn5, xn55.nodeId, "a");
    const yn55 = b.add("math", { op: "add" }, { b: 0.5 });
    b.connect(yn5, yn55.nodeId, "a");
    const fx = b.add("math", { op: "add" });
    b.connect(xn55, fx.nodeId, "a");
    b.connect(gi.panX, fx.nodeId, "b");
    const fy = b.add("math", { op: "add" });
    b.connect(yn55, fy.nodeId, "a");
    b.connect(gi.panY, fy.nodeId, "b");
    const finalUv = b.add("combine-xy", {});
    b.connect(fx, finalUv.nodeId, "x");
    b.connect(fy, finalUv.nodeId, "y");

    const sample = b.add("sample-previous-pass", { edges: "transparent" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Perspective);
export default Perspective;
