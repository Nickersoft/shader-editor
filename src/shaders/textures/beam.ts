import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Beam",
  description: "Directional light beam",
  color: "#fde68a",
  category: "textures",
  defaultBlendMode: "normal",
};

// Decomposed beam: angle pin → rotate-2D unit vector → dot with `p` → abs →
// smoothstep falloff. Users can swap the rotate2D step for a Const-driven
// vector to lock the beam, or wire the half-width to another signal (e.g. a
// Noise) to get a pulsing or wobbling beam.
export class Beam extends ProceduralShader {
  static readonly typeId = "beam";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "angle", type: "float", label: "Angle (deg)", default: 0 },
      { id: "width", type: "float", label: "Width", default: 0.2 },
      { id: "softness", type: "float", label: "Softness", default: 0.3 },
    ]);

    const p = b.position();

    // angle (deg) → radians
    const rad = b.add("math", { op: "mul" }, { b: Math.PI / 180 });
    b.connect(gi.angle, rad.nodeId, "a");

    // Beam normal = vec2(-sin(rad), cos(rad)). VectorMath.rotate2D applied to
    // (0, 1) by `rad` gives (-sin, cos), which is exactly the legacy normal.
    const up = b.add("combine-xy", {}, { x: 0, y: 1 });
    const normal = b.add("vector-math", { op: "rotate-2d" });
    b.connect(up, normal.nodeId, "a");
    b.connect(rad, normal.nodeId, "b");

    // Signed distance to the beam axis: dot(p, normal).
    const signed = b.add("vector-math", { op: "dot" });
    b.connect(p, signed.nodeId, "a");
    b.connect(normal, signed.nodeId, "b");
    const dist = b.add("math", { op: "abs" });
    b.connect(signed, dist.nodeId, "x");

    // Half-width and outer edge of the falloff band.
    const halfWidth = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gi.width, halfWidth.nodeId, "a");
    const halfSoft = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gi.softness, halfSoft.nodeId, "a");
    const outer = b.add("math", { op: "add" });
    b.connect(halfWidth, outer.nodeId, "a");
    b.connect(halfSoft, outer.nodeId, "b");

    // mask = 1 - smoothstep(halfWidth, outer, dist).
    const ss = b.add("smoothstep", {});
    b.connect(halfWidth, ss.nodeId, "edge0");
    b.connect(outer, ss.nodeId, "edge1");
    b.connect(dist, ss.nodeId, "x");
    const mask = b.add("math", { op: "oneminus" });
    b.connect(ss, mask.nodeId, "x");

    const ramp = b.colorRamp(mask, [
      [0, 0, 0],
      [1, 0.5, 0.2],
    ]);
    return b.output(ramp);
  }
}

register(Beam);
export default Beam;
