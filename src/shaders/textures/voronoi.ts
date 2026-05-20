import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Voronoi Cells",
  description: "Cellular pattern",
  color: "#06b6d4",
  category: "textures",
  defaultBlendMode: "normal",
};

export class Voronoi extends ProceduralShader {
  static readonly typeId = "voronoi";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 6, speed: 0.5, seed: 0 });
    const vor = b.add(new N.VoronoiTexture({
      feature: "f1",
      metric: "euclidean",
      randomness: 1,
      smoothness: 0.25,
    }));
    b.connect(src.p).to(vor, "p");
    b.connect(src.t).to(vor, "t");
    const ramp = b.colorRamp(vor, [
      [0.99, 0.01, 0.87],
      [0.19, 0.53, 0.81],
    ]);
    return b.output(ramp);
  }
}

register(Voronoi);
export default Voronoi;
