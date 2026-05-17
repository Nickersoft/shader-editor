import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
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
    const fbm = b.add("noise-texture", { kind: "fbm", detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(src.p, fbm.nodeId, "p");
    b.connect(src.t, fbm.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(fbm, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(SimplexNoise);
export default SimplexNoise;
