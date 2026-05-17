import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
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
    const fp = b.add("floating-particles", {});
    // mix(black, particle.color, particle.alpha) — `a` defaults to vec3(0).
    const mix = b.add("mix-color", {});
    b.connect({ nodeId: fp.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: fp.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  }
}

register(FloatingParticles);
export default FloatingParticles;
