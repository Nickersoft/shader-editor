import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Solid Color",
  description: "Fill the canvas with a single solid color",
  color: "#a3a3a3",
  category: "textures",
  defaultBlendMode: "normal",
};

export class SolidColor extends ProceduralShader {
  static readonly typeId = "solid-color";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    // A two-stop ramp sampled at t=0 collapses to its first stop — no
    // upstream wiring needed.
    const ramp = b.add(
      "color-ramp",
      {
        stops: [
          { position: 0, color: [0.357, 0.094, 0.792] },
          { position: 1, color: [0.357, 0.094, 0.792] },
        ],
      },
      { t: 0 },
    );
    return b.output(ramp);
  }
}

register(SolidColor);
export default SolidColor;
