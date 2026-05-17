import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Multi-Point Gradient",
  description: "Four-stop linear gradient",
  color: "#10b981",
  category: "textures",
  defaultBlendMode: "normal",
};

export class MultiPointGradient extends ProceduralShader {
  static readonly typeId = "multi-point-gradient";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("gradient-domain", { mode: "linear" });
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.31, 0.78, 0.47],
      [0.16, 0.5, 0.95],
    ]);
    return b.output(ramp);
  }
}

register(MultiPointGradient);
export default MultiPointGradient;
