import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
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
    const rw = b.add("ripple-texture", { frequency: 20, speed: 1, phase: 0 });
    b.connect(p, rw.nodeId, "p");
    b.connect(t, rw.nodeId, "t");
    const ramp = b.colorRamp(rw, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(Ripples);
export default Ripples;
