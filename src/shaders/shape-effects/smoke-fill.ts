// SmokeFill — graph-decomposed. fbm noise drives the smoke colour; the
// underlying alpha mask gates where smoke paints, and `intensity` scales how
// strongly the smoke replaces the base colour.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Smoke Fill",
  description: "Fill an alpha mask with billowing smoke",
  color: "#94a3b8",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class SmokeFill extends ProceduralEffect {
  static readonly typeId = "smoke-fill";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "speed", type: "float", label: "Speed", default: 0.3 },
      { id: "scale", type: "float", label: "Scale", default: 2 },
      { id: "color1", type: "vec3", label: "Color 1", default: [0.55, 0.95, 1] },
      { id: "color2", type: "vec3", label: "Color 2", default: [0.02, 0.63, 0.84] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // q = uv * scale + t * speed * 0.1  (along y axis only — matches the
    // legacy vec2(0, speed*0.1) drift)
    const scaled = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(scaled, "a");
    b.connect(gi.scale).to(scaled, "b");
    const drift = b.add(new N.Math({ op: "mul" }), { b: 0.1 });
    const driftScaled = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(driftScaled, "a");
    b.connect(gi.speed).to(driftScaled, "b");
    b.connect(driftScaled).to(drift, "a");
    const driftV = b.add(new N.CombineXy(), { x: 0 });
    b.connect(drift).to(driftV, "y");
    const q = b.add(new N.VectorMath({ op: "add" }));
    b.connect(scaled).to(q, "a");
    b.connect(driftV).to(q, "b");

    const n = b.add(new N.NoiseTexture({
      kind: "fbm",
      scale: 1,
      seed: 0,
      detail: 4,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
    }));
    b.connect(q).to(n, "p");

    // smoke = mix(c1, c2, n)
    const smoke = b.add(new N.MixColor());
    b.connect(gi.color1).to(smoke, "a");
    b.connect(gi.color2).to(smoke, "b");
    b.connect(n).to(smoke, "t");

    // mixT = alpha · intensity · n   (gates smoke by the existing alpha mask)
    const mixT1 = b.add(new N.Math({ op: "mul" }));
    b.connect(sampleAlpha).to(mixT1, "a");
    b.connect(gi.intensity).to(mixT1, "b");
    const mixT = b.add(new N.Math({ op: "mul" }));
    b.connect(mixT1).to(mixT, "a");
    b.connect(n).to(mixT, "b");

    const mixed = b.add(new N.MixColor());
    b.connect(sampleColor).to(mixed, "a");
    b.connect(smoke).to(mixed, "b");
    b.connect(mixT).to(mixed, "t");

    return b.output(mixed, sampleAlpha);
  }
}

register(SmokeFill);
export default SmokeFill;
