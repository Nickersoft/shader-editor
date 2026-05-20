import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Flowing Gradient",
  description: "Liquid silk gradient",
  color: "#6b17e6",
  category: "textures",
  defaultBlendMode: "normal",
};

export class FlowingGradient extends ProceduralShader {
  static readonly typeId = "flowing-gradient";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const w1 = b.domainWarp(src.p, src.t, {
      amplitude: 0.8, detail: 2, scale: 0.8, timePhase: 1,
    });
    const w2 = b.domainWarp(w1, src.t, {
      amplitude: 0.8, detail: 2, scale: 1, timePhase: 1.3,
    });
    const fbm = b.add(new N.NoiseTexture({ kind: "fbm", detail: 2, lacunarity: 2, roughness: 0.5, distortion: 0 }));
    b.connect(w2).to(fbm, "p");
    b.connect(src.t).to(fbm, "t");
    const ramp = b.colorRamp(fbm, [
      [0.04, 0.0, 0.08],
      [0.42, 0.09, 0.9],
      [1.0, 0.3, 0.42],
      [1.0, 0.42, 0.21],
    ]);
    return b.output(ramp);
  }
}

register(FlowingGradient);
export default FlowingGradient;
