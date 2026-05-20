import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Studio Background",
  description: "Radial studio key + fill wash",
  color: "#94a3b8",
  category: "textures",
  defaultBlendMode: "normal",
};

export class StudioBackground extends ProceduralShader {
  static readonly typeId = "studio-background";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add(new N.GradientDomain({ mode: "radial" }));
    b.connect(uv).to(domain, "p");
    const ramp = b.colorRamp(domain, [
      [0.95, 0.97, 1.0],
      [0.83, 0.89, 0.92],
      [0.78, 0.83, 0.91],
      [0.65, 0.71, 0.83],
    ]);
    return b.output(ramp);
  }
}

register(StudioBackground);
export default StudioBackground;
