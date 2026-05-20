import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "White Noise",
  description: "Per-pixel hash random",
  color: "#e5e7eb",
  category: "textures",
  defaultBlendMode: "normal",
};

export class WhiteNoise extends ProceduralShader {
  static readonly typeId = "white-noise";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const noise = b.add(new N.NoiseTexture({ kind: "white", scale: 80, seed: 0 }));
    b.connect(p).to(noise, "p");
    const ramp = b.colorRamp(noise, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(WhiteNoise);
export default WhiteNoise;
