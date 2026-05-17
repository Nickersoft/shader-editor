// SmokeFill — graph-decomposed. fbm noise drives the smoke colour; the
// underlying alpha mask gates where smoke paints, and `intensity` scales how
// strongly the smoke replaces the base colour.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // q = uv * scale + t * speed * 0.1  (along y axis only — matches the
    // legacy vec2(0, speed*0.1) drift)
    const scaled = b.add("vector-math", { op: "scale" });
    b.connect(uv, scaled.nodeId, "a");
    b.connect(gi.scale, scaled.nodeId, "b");
    const drift = b.add("math", { op: "mul" }, { b: 0.1 });
    const driftScaled = b.add("math", { op: "mul" });
    b.connect(t, driftScaled.nodeId, "a");
    b.connect(gi.speed, driftScaled.nodeId, "b");
    b.connect(driftScaled, drift.nodeId, "a");
    const driftV = b.add("combine-xy", {}, { x: 0 });
    b.connect(drift, driftV.nodeId, "y");
    const q = b.add("vector-math", { op: "add" });
    b.connect(scaled, q.nodeId, "a");
    b.connect(driftV, q.nodeId, "b");

    const n = b.add("noise-texture", {
      kind: "fbm",
      scale: 1,
      seed: 0,
      detail: 4,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
    });
    b.connect(q, n.nodeId, "p");

    // smoke = mix(c1, c2, n)
    const smoke = b.add("mix-color", {});
    b.connect(gi.color1, smoke.nodeId, "a");
    b.connect(gi.color2, smoke.nodeId, "b");
    b.connect(n, smoke.nodeId, "t");

    // mixT = alpha · intensity · n   (gates smoke by the existing alpha mask)
    const mixT1 = b.add("math", { op: "mul" });
    b.connect(sampleAlpha, mixT1.nodeId, "a");
    b.connect(gi.intensity, mixT1.nodeId, "b");
    const mixT = b.add("math", { op: "mul" });
    b.connect(mixT1, mixT.nodeId, "a");
    b.connect(n, mixT.nodeId, "b");

    const mixed = b.add("mix-color", {});
    b.connect(sampleColor, mixed.nodeId, "a");
    b.connect(smoke, mixed.nodeId, "b");
    b.connect(mixT, mixed.nodeId, "t");

    return b.output(mixed, sampleAlpha);
  }
}

register(SmokeFill);
export default SmokeFill;
