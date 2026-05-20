import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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
    const st = b.add(new N.Strands());
    // mix(black, strand.color, strand.alpha) — `a` defaults to vec3(0).
    const mix = b.add(new N.MixColor());
    b.connect(st, "color").to(mix, "b");
    b.connect(st, "alpha").to(mix, "t");
    return b.output(mix);
  }
}

register(Strands);
export default Strands;
