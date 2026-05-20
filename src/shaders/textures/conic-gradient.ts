import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Conic Gradient",
  description: "Angular sweep around a draggable center",
  color: "#a855f7",
  category: "textures",
  defaultBlendMode: "normal",
};

export class ConicGradient extends ProceduralShader {
  static readonly typeId = "conic-gradient";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add(new N.GradientDomain({ mode: "conic" }));
    b.connect(uv).to(domain, "p");
    const ramp = b.colorRamp(domain, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.31, 0.78, 0.47],
      [0.95, 0.27, 0.42],
    ]);
    return b.output(ramp);
  }
}

register(ConicGradient);
export default ConicGradient;
