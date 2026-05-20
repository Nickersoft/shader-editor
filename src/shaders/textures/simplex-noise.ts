import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Simplex Noise",
  description: "Organic noise field",
  color: "#8b5cf6",
  category: "textures",
  defaultBlendMode: "normal",
};

export class SimplexNoise extends ProceduralShader {
  static readonly typeId = "simplex-noise";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 2, speed: 1, seed: 0 });
    const fbm = b.add(new N.NoiseTexture({ kind: "fbm", detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 }));
    b.connect(src.p).to(fbm, "p");
    b.connect(src.t).to(fbm, "t");
    const rm = b.add(new N.Remap({ balance: 0, contrast: 0 }));
    b.connect(fbm).to(rm, "x");
    const ramp = b.colorRamp(rm, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(SimplexNoise);
export default SimplexNoise;
