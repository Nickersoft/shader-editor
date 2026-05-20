import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Ripples",
  description: "Concentric animated ripples",
  color: "#22d3ee",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Ripples extends ProceduralShader {
  static readonly typeId = "ripples";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const rw = b.add(new N.RippleWave({ frequency: 20, speed: 1, phase: 0 }));
    b.connect(p).to(rw, "p");
    b.connect(t).to(rw, "t");
    const ramp = b.colorRamp(rw, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(Ripples);
export default Ripples;
