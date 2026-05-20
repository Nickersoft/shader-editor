import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Plasma",
  description: "Animated plasma effect",
  color: "#ec4899",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Plasma extends ProceduralShader {
  static readonly typeId = "plasma";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 2, speed: 2, seed: 0 });
    const warp = b.domainWarp(
      src.p,
      src.t,
      { amplitude: 0.4, detail: 4, scale: 1, timePhase: 1 },
    );
    const pl = b.add(new N.PlasmaSample({ intensity: 1.5 }));
    b.connect(warp).to(pl, "p");
    b.connect(src.t).to(pl, "t");
    const rm = b.add(new N.Remap({ balance: 0, contrast: 0 }));
    b.connect(pl).to(rm, "x");
    const ramp = b.colorRamp(rm, [
      [0, 0, 0],
      [0.44, 0.09, 0.75],
    ]);
    return b.output(ramp);
  }
}

register(Plasma);
export default Plasma;
