// Form3D — graph-decomposed pseudo-3D pan/tilt projection.
//   p = uv − c
//   p *= tan(fov · π/360)
//   denomY = 1 + p.x · tan(pan)
//   warpedY = p.y / max(denomY, ε)
//   denomX = 1 + warpedY · tan(tilt)
//   warpedX = p.x / max(denomX, ε)
//   finalUV = vec2(warpedX, warpedY) + c

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const c = b.add("combine-xy", {});
    b.connect(gi.centerX, c.nodeId, "x");
    b.connect(gi.centerY, c.nodeId, "y");

    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const deg360 = b.add("value", { value: Math.PI / 360 });
    const eps = b.add("value", { value: 0.001 });

    const panR = b.add("math", { op: "mul" });
    b.connect(gi.pan, panR.nodeId, "a");
    b.connect(deg2rad, panR.nodeId, "b");
    const tiltR = b.add("math", { op: "mul" });
    b.connect(gi.tilt, tiltR.nodeId, "a");
    b.connect(deg2rad, tiltR.nodeId, "b");
    const halfFov = b.add("math", { op: "mul" });
    b.connect(gi.fov, halfFov.nodeId, "a");
    b.connect(deg360, halfFov.nodeId, "b");

    const fovScale = b.add("math", { op: "tan" });
    b.connect(halfFov, fovScale.nodeId, "x");
    const tanPan = b.add("math", { op: "tan" });
    b.connect(panR, tanPan.nodeId, "x");
    const tanTilt = b.add("math", { op: "tan" });
    b.connect(tiltR, tanTilt.nodeId, "x");

    const dCenter = b.add("vector-math", { op: "sub" });
    b.connect(uv, dCenter.nodeId, "a");
    b.connect(c, dCenter.nodeId, "b");
    const p = b.add("vector-math", { op: "scale" });
    b.connect(dCenter, p.nodeId, "a");
    b.connect(fovScale, p.nodeId, "b");

    const split = b.add("separate-xy", {});
    b.connect(p, split.nodeId, "v");
    const px = { nodeId: split.nodeId, pin: "x" };
    const py = { nodeId: split.nodeId, pin: "y" };

    // denomY = 1 + p.x · tan(pan)
    const one = b.add("value", { value: 1 });
    const pxTan = b.add("math", { op: "mul" });
    b.connect(px, pxTan.nodeId, "a");
    b.connect(tanPan, pxTan.nodeId, "b");
    const denomY = b.add("math", { op: "add" });
    b.connect(one, denomY.nodeId, "a");
    b.connect(pxTan, denomY.nodeId, "b");
    const safeDenomY = b.add("math", { op: "max" });
    b.connect(denomY, safeDenomY.nodeId, "a");
    b.connect(eps, safeDenomY.nodeId, "b");
    const warpedY = b.add("math", { op: "div" });
    b.connect(py, warpedY.nodeId, "a");
    b.connect(safeDenomY, warpedY.nodeId, "b");

    const wyTan = b.add("math", { op: "mul" });
    b.connect(warpedY, wyTan.nodeId, "a");
    b.connect(tanTilt, wyTan.nodeId, "b");
    const denomX = b.add("math", { op: "add" });
    b.connect(one, denomX.nodeId, "a");
    b.connect(wyTan, denomX.nodeId, "b");
    const safeDenomX = b.add("math", { op: "max" });
    b.connect(denomX, safeDenomX.nodeId, "a");
    b.connect(eps, safeDenomX.nodeId, "b");
    const warpedX = b.add("math", { op: "div" });
    b.connect(px, warpedX.nodeId, "a");
    b.connect(safeDenomX, warpedX.nodeId, "b");

    const warped = b.add("combine-xy", {});
    b.connect(warpedX, warped.nodeId, "x");
    b.connect(warpedY, warped.nodeId, "y");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(warped, finalUv.nodeId, "a");
    b.connect(c, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "transparent" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Form3D);
export default Form3D;
