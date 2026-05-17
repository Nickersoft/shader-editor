import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Sine Wave",
  description: "Animated sine wave bands",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

export class SineWave extends ProceduralShader {
  static readonly typeId = "sine-wave";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const wv = b.add("wave-texture", {
      type: "bands",
      profile: "sine",
      scale: 5,
      phaseOffset: 0,
      distortion: 0,
      detail: 3,
    });
    b.connect(src.p, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(SineWave);
export default SineWave;
