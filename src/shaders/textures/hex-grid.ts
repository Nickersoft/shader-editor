import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Hex Grid",
  description: "Honeycomb hexagonal grid",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

export class HexGrid extends ProceduralShader {
  static readonly typeId = "hex-grid";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const hg = b.add(new N.LatticeMask({ mode: "hex", scale: 8, lineWidth: 1 }));
    b.connect(p).to(hg, "p");
    const ramp = b.colorRamp(hg, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  }
}

register(HexGrid);
export default HexGrid;
