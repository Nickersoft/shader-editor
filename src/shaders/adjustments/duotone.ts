// Duotone — graph-decomposed adjustment.
//   lum = luma(rgb)
//   t = smoothstep(blend - 0.5, blend + 0.5, lum)
//   result = mix(colorA, colorB, t)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Duotone",
  description: "Map colors to two tones based on luminance",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Duotone extends ProceduralEffect {
  static readonly typeId = "duotone";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "colorA", type: "vec3", label: "Color A (shadows)", default: [1, 0, 0] },
      {
        id: "colorB",
        type: "vec3",
        label: "Color B (highlights)",
        default: [0.008, 0.227, 0.957],
      },
      { id: "blend", type: "float", label: "Blend", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add("color-math", { op: "luminance" });
    b.connect(color, lum.nodeId, "a");

    const half = b.add("value", { value: 0.5 });
    const e0 = b.add("math", { op: "sub" });
    b.connect(gi.blend, e0.nodeId, "a");
    b.connect(half, e0.nodeId, "b");
    const e1 = b.add("math", { op: "add" });
    b.connect(gi.blend, e1.nodeId, "a");
    b.connect(half, e1.nodeId, "b");

    const t = b.add("smoothstep", {});
    b.connect(e0, t.nodeId, "edge0");
    b.connect(e1, t.nodeId, "edge1");
    b.connect(lum, t.nodeId, "x");

    const result = b.add("mix-color", { clampT: true });
    b.connect(gi.colorA, result.nodeId, "a");
    b.connect(gi.colorB, result.nodeId, "b");
    b.connect(t, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Duotone);
export default Duotone;
