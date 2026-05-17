import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Wave Rings",
  description: "Concentric ring waves",
  color: "#8b5cf6",
  category: "textures",
  defaultBlendMode: "normal",
};

export class WaveRings extends ProceduralShader {
  static readonly typeId = "wave-rings";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const wv = b.add("wave-texture", {
      type: "rings",
      profile: "sine",
      scale: 6,
      phaseOffset: 0,
      distortion: 0.3,
      detail: 2,
    });
    b.connect(p, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [0.95, 0.95, 1],
      [0.05, 0.05, 0.1],
    ]);
    return b.output(ramp);
  }
}

register(WaveRings);
export default WaveRings;
