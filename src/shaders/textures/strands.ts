import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Strands",
  description: "Wavy strand bundle",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Strands extends ProceduralShader {
  static readonly typeId = "strands";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const st = b.add("strands", {});
    // mix(black, strand.color, strand.alpha) — `a` defaults to vec3(0).
    const mix = b.add("mix-color", {});
    b.connect({ nodeId: st.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: st.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  }
}

register(Strands);
export default Strands;
