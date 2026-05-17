import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Radial Gradient",
  description: "Circular gradient with draggable center + radius",
  color: "#ec4899",
  category: "textures",
  defaultBlendMode: "normal",
};

export class RadialGradient extends ProceduralShader {
  static readonly typeId = "radial-gradient";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("gradient-domain", { mode: "radial" });
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [1.0, 0.8, 0.4],
      [0.1, 0.05, 0.2],
    ]);
    return b.output(ramp);
  }
}

register(RadialGradient);
export default RadialGradient;
