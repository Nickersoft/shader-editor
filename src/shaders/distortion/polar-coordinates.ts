// PolarCoordinates — graph-decomposed (rect-to-polar mode). The polar-to-rect
// inverse and the aspect-ratio correction in the original are dropped; the
// graph builds raw `(angle/2π, r/radius)` UVs from the screen-uv. `intensity`
// blends between identity and the polar remap.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Polar Coordinates",
  description: "Rectangular ↔ polar UV remap",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class PolarCoordinates extends ProceduralEffect {
  static readonly typeId = "polar-coordinates";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.5 },
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const c = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(c, "x");
    b.connect(gi.centerY).to(c, "y");

    // d = uv − centre
    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(c).to(d, "b");
    const sep = b.add(new N.SeparateXy());
    b.connect(d).to(sep, "v");

    // angleN = (atan2(dy, dx) + π) / 2π
    const ang = b.add(new N.Math({ op: "atan2" }));
    b.connect(sep, "y").to(ang, "a");
    b.connect(sep, "x").to(ang, "b");
    const shifted = b.add(new N.Math({ op: "add" }), { b: Math.PI });
    b.connect(ang).to(shifted, "a");
    const angleN = b.add(new N.Math({ op: "mul" }), { b: 1 / (Math.PI * 2) });
    b.connect(shifted).to(angleN, "a");

    // r = length(d) / radius
    const len = b.add(new N.VectorMath({ op: "length" }));
    b.connect(d).to(len, "a");
    const r = b.add(new N.Math({ op: "div" }));
    b.connect(len).to(r, "a");
    b.connect(gi.radius).to(r, "b");

    const transformed = b.add(new N.CombineXy());
    b.connect(angleN).to(transformed, "x");
    b.connect(r).to(transformed, "y");

    // finalUV = mix(uv, transformed, intensity) — implemented with two
    // scale+add nodes because mix-color works on vec3 and there's no vec2 mix.
    const oneMinus = b.add(new N.Math({ op: "oneminus" }));
    b.connect(gi.intensity).to(oneMinus, "x");
    const part1 = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(part1, "a");
    b.connect(oneMinus).to(part1, "b");
    const part2 = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(transformed).to(part2, "a");
    b.connect(gi.intensity).to(part2, "b");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(part1).to(finalUv, "a");
    b.connect(part2).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(PolarCoordinates);
export default PolarCoordinates;
