// Fog — graph-decomposed. fbm noise driven by uv (offset by mouse drift)
// plus a horizontal time scroll; mixed with the underlying frame.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Fog",
  description: "Drifting volumetric fog",
  color: "#cbd5e1",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class Fog extends GraphEffectBase {
  static readonly typeId = "fog";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "speed", type: "float", label: "Speed", default: 0.3 },
      { id: "scale", type: "float", label: "Scale", default: 1 },
      { id: "color1", type: "vec3", label: "Color 1", default: [1, 1, 1] },
      { id: "color2", type: "vec3", label: "Color 2", default: [0.5, 0.5, 0.5] },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");
    const mouse = b.add("mouse", {}, undefined, "position");

    // mouseDrift = (mouse − 0.5) · 0.5
    const half = b.add("value", { value: 0.5 });
    const halfV = b.add("combine-xy", {});
    b.connect(half, halfV.nodeId, "x");
    b.connect(half, halfV.nodeId, "y");
    const md1 = b.add("vector-math", { op: "sub" });
    b.connect(mouse, md1.nodeId, "a");
    b.connect(halfV, md1.nodeId, "b");
    const drift = b.add("vector-math", { op: "scale" });
    b.connect(md1, drift.nodeId, "a");
    b.connect(half, drift.nodeId, "b");

    // sample point: (uv + drift) · scale, plus time scroll along x.
    const offset = b.add("vector-math", { op: "add" });
    b.connect(uv, offset.nodeId, "a");
    b.connect(drift, offset.nodeId, "b");
    const q = b.add("vector-math", { op: "scale" });
    b.connect(offset, q.nodeId, "a");
    b.connect(gi.scale, q.nodeId, "b");

    const ts = b.add("math", { op: "mul" });
    b.connect(t, ts.nodeId, "a");
    b.connect(gi.speed, ts.nodeId, "b");
    const tsV = b.add("combine-xy", {}, { y: 0 });
    b.connect(ts, tsV.nodeId, "x");
    const sampleP = b.add("vector-math", { op: "add" });
    b.connect(q, sampleP.nodeId, "a");
    b.connect(tsV, sampleP.nodeId, "b");

    const n = b.add("noise-texture", {
      kind: "fbm",
      scale: 1,
      seed: 0,
      detail: 4,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
    });
    b.connect(sampleP, n.nodeId, "p");

    // fogColor = mix(c1, c2, n)
    const fogColor = b.add("mix-color", {});
    b.connect(gi.color1, fogColor.nodeId, "a");
    b.connect(gi.color2, fogColor.nodeId, "b");
    b.connect(n, fogColor.nodeId, "t");

    // Underlying frame
    const base = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, base.nodeId, "uv");

    // mixT = n · intensity
    const mixT = b.add("math", { op: "mul" });
    b.connect(n, mixT.nodeId, "a");
    b.connect(gi.intensity, mixT.nodeId, "b");

    const out = b.add("mix-color", {});
    b.connect({ nodeId: base.nodeId, pin: "color" }, out.nodeId, "a");
    b.connect(fogColor, out.nodeId, "b");
    b.connect(mixT, out.nodeId, "t");

    return b.output(out, { nodeId: base.nodeId, pin: "alpha" });
  }
}

register(Fog);
export default Fog;
