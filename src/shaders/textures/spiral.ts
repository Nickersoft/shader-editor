import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
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
    const wv = b.add("wave-texture", {
      type: "bands",
      profile: "sine",
      scale: 1.5,
      phaseOffset: 0,
      distortion: 0,
      detail: 3,
    });
    b.connect(polar, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  }
}

register(Spiral);
export default Spiral;
