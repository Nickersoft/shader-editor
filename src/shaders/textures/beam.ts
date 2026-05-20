import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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
    const rad = b.add(new N.Math({ op: "mul" }), { b: Math.PI / 180 });
    b.connect(gi.angle).to(rad, "a");

    // Beam normal = vec2(-sin(rad), cos(rad)). VectorMath.rotate2D applied to
    // (0, 1) by `rad` gives (-sin, cos), which is exactly the legacy normal.
    const up = b.add(new N.CombineXy(), { x: 0, y: 1 });
    const normal = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(up).to(normal, "a");
    b.connect(rad).to(normal, "b");

    // Signed distance to the beam axis: dot(p, normal).
    const signed = b.add(new N.VectorMath({ op: "dot" }));
    b.connect(p).to(signed, "a");
    b.connect(normal).to(signed, "b");
    const dist = b.add(new N.Math({ op: "abs" }));
    b.connect(signed).to(dist, "x");

    // Half-width and outer edge of the falloff band.
    const halfWidth = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(gi.width).to(halfWidth, "a");
    const halfSoft = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(gi.softness).to(halfSoft, "a");
    const outer = b.add(new N.Math({ op: "add" }));
    b.connect(halfWidth).to(outer, "a");
    b.connect(halfSoft).to(outer, "b");

    // mask = 1 - smoothstep(halfWidth, outer, dist).
    const ss = b.add(new N.Smoothstep());
    b.connect(halfWidth).to(ss, "edge0");
    b.connect(outer).to(ss, "edge1");
    b.connect(dist).to(ss, "x");
    const mask = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(mask, "x");

    const ramp = b.colorRamp(mask, [
      [0, 0, 0],
      [1, 0.5, 0.2],
    ]);
    return b.output(ramp);
  }
}

register(Beam);
export default Beam;
