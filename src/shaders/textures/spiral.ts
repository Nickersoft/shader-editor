import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Spiral",
  description: "Polar-warped wave spiral",
  color: "#a855f7",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Spiral extends ProceduralShader {
  static readonly typeId = "spiral";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const polar = b.polarDomain(src.p, 1, 1);
    const wv = b.add(new N.WaveTexture({
      type: "bands",
      profile: "sine",
      scale: 1.5,
      phaseOffset: 0,
      distortion: 0,
      detail: 3,
    }));
    b.connect(polar).to(wv, "p");
    const ramp = b.colorRamp(wv, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  }
}

register(Spiral);
export default Spiral;
