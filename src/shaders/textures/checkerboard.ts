import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Checker",
  description: "Hard checker pattern",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Checkerboard extends ProceduralShader {
  static readonly typeId = "checker";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const ck = b.add("lattice-mask", { mode: "checker", scale: 8 });
    b.connect(p, ck.nodeId, "p");
    const ramp = b.colorRamp(ck, [
      [0.95, 0.95, 0.95],
      [0.05, 0.05, 0.05],
    ]);
    return b.output(ramp);
  }
}

register(Checkerboard);
export default Checkerboard;
