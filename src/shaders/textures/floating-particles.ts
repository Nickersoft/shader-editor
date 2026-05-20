import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Floating Particles",
  description: "Layered drifting particles",
  color: "#fbbf24",
  category: "textures",
  defaultBlendMode: "normal",
};

export class FloatingParticles extends ProceduralShader {
  static readonly typeId = "floating-particles";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const fp = b.add(new N.FloatingParticles());
    // mix(black, particle.color, particle.alpha) — `a` defaults to vec3(0).
    const mix = b.add(new N.MixColor());
    b.connect(fp, "color").to(mix, "b");
    b.connect(fp, "alpha").to(mix, "t");
    return b.output(mix);
  }
}

register(FloatingParticles);
export default FloatingParticles;
