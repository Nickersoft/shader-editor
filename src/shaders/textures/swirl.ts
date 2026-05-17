import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Swirl",
  description: "Multi-layered noise swirl",
  color: "#22d3ee",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Swirl extends ProceduralShader {
  static readonly typeId = "swirl";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const w1 = b.domainWarp(src.p, src.t, {
      amplitude: 1, detail: 4, scale: 1, timePhase: 1,
    });
    const w2 = b.domainWarp(w1, src.t, {
      amplitude: 1, detail: 4, scale: 1.6, timePhase: 1.3,
    });
    const fbm = b.add("noise-texture", { kind: "fbm", detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(w2, fbm.nodeId, "p");
    b.connect(src.t, fbm.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(fbm, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0.88, 0.57, 0.21],
      [0.07, 0.46, 0.85],
    ]);
    return b.output(ramp);
  }
}

register(Swirl);
export default Swirl;
