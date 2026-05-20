import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Diamond Gradient",
  description: "Diamond-shaped iso-contours over a draggable center",
  color: "#f59e0b",
  category: "textures",
  defaultBlendMode: "normal",
};

export class DiamondGradient extends ProceduralShader {
  static readonly typeId = "diamond-gradient";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add(new N.GradientDomain({ mode: "diamond" }));
    b.connect(uv).to(domain, "p");
    const ramp = b.colorRamp(domain, [
      [1.0, 0.92, 0.45],
      [0.86, 0.21, 0.27],
    ]);
    return b.output(ramp);
  }
}

register(DiamondGradient);
export default DiamondGradient;
