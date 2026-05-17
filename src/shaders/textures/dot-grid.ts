import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Dot Grid",
  description: "Grid of dots",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

export class DotGrid extends ProceduralShader {
  static readonly typeId = "dot-grid";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const dg = b.add("lattice-mask", { mode: "dots", scale: 30, radius: 0.3, softness: 0.05 });
    b.connect(p, dg.nodeId, "p");
    const ramp = b.colorRamp(dg, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  }
}

register(DotGrid);
export default DotGrid;
