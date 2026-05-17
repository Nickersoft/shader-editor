import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Grid",
  description: "Orthogonal grid lines",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Grid extends ProceduralShader {
  static readonly typeId = "grid";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const gl = b.add("lattice-mask", { mode: "lines", scale: 10, lineWidth: 0.06, softness: 0.04 });
    b.connect(p, gl.nodeId, "p");
    const ramp = b.colorRamp(gl, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  }
}

register(Grid);
export default Grid;
