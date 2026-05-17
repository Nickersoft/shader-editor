import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Gradient",
  description: "Two-stop linear gradient",
  color: "#10b981",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Gradient extends ProceduralShader {
  static readonly typeId = "gradient";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("gradient-domain", { mode: "linear" });
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [0.0, 0.0, 1.0],
      [0.1, 1.0, 0.0],
    ]);
    return b.output(ramp);
  }
}

register(Gradient);
export default Gradient;
