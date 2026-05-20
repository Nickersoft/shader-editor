// Fog — graph-decomposed. fbm noise driven by uv (offset by mouse drift)
// plus a horizontal time scroll; mixed with the underlying frame.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Fog",
  description: "Drifting volumetric fog",
  color: "#cbd5e1",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class Fog extends ProceduralEffect {
  static readonly typeId = "fog";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "speed", type: "float", label: "Speed", default: 0.3 },
      { id: "scale", type: "float", label: "Scale", default: 1 },
      { id: "color1", type: "vec3", label: "Color 1", default: [1, 1, 1] },
      { id: "color2", type: "vec3", label: "Color 2", default: [0.5, 0.5, 0.5] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");
    const mouse = b.add(new N.Mouse(), undefined, "position");

    // mouseDrift = (mouse − 0.5) · 0.5
    const half = b.add(new N.Const({ value: 0.5 }));
    const halfV = b.add(new N.CombineXy());
    b.connect(half).to(halfV, "x");
    b.connect(half).to(halfV, "y");
    const md1 = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(mouse).to(md1, "a");
    b.connect(halfV).to(md1, "b");
    const drift = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(md1).to(drift, "a");
    b.connect(half).to(drift, "b");

    // sample point: (uv + drift) · scale, plus time scroll along x.
    const offset = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(offset, "a");
    b.connect(drift).to(offset, "b");
    const q = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(offset).to(q, "a");
    b.connect(gi.scale).to(q, "b");

    const ts = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(ts, "a");
    b.connect(gi.speed).to(ts, "b");
    const tsV = b.add(new N.CombineXy(), { y: 0 });
    b.connect(ts).to(tsV, "x");
    const sampleP = b.add(new N.VectorMath({ op: "add" }));
    b.connect(q).to(sampleP, "a");
    b.connect(tsV).to(sampleP, "b");

    const n = b.add(new N.NoiseTexture({
      kind: "fbm",
      scale: 1,
      seed: 0,
      detail: 4,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
    }));
    b.connect(sampleP).to(n, "p");

    // fogColor = mix(c1, c2, n)
    const fogColor = b.add(new N.MixColor());
    b.connect(gi.color1).to(fogColor, "a");
    b.connect(gi.color2).to(fogColor, "b");
    b.connect(n).to(fogColor, "t");

    // Underlying frame
    const base = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(base, "uv");

    // mixT = n · intensity
    const mixT = b.add(new N.Math({ op: "mul" }));
    b.connect(n).to(mixT, "a");
    b.connect(gi.intensity).to(mixT, "b");

    const out = b.add(new N.MixColor());
    b.connect(base, "color").to(out, "a");
    b.connect(fogColor).to(out, "b");
    b.connect(mixT).to(out, "t");

    return b.output(out, { nodeId: base.nodeId, pin: "alpha" });
  }
}

register(Fog);
export default Fog;
