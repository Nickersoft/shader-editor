import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Brick",
  description: "Running-bond brick pattern",
  color: "#dc2626",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Brick extends ProceduralShader {
  static readonly typeId = "brick";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const br = b.add("brick-texture", {
      scale: 5,
      rowHeight: 0.5,
      brickWidth: 1,
      offset: 0.5,
      mortarSize: 0.05,
      bias: 0.5,
    });
    b.connect(p, br.nodeId, "p");
    const ramp = b.colorRamp(br, [
      [0.78, 0.34, 0.24],
      [0.18, 0.16, 0.15],
    ]);
    return b.output(ramp);
  }
}

register(Brick);
export default Brick;
