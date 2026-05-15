// AngularBlur — graph-decomposed. The `sampler` primitive's angular mode
// rotates `uv` around `center` by ±amount radians across N taps. The legacy
// effect uses Gaussian-weighted samples and an aspect-ratio correction; this
// version uses uniform weights in UV space — the smear character is
// preserved but the falloff at the arc ends is sharper.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Angular Blur",
  description: "Circular blur around a focal point",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class AngularBlur extends GraphEffectBase {
  static readonly typeId = "angular-blur";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const center = b.add("combine-xy", {});
    b.connect(gi.centerX, center.nodeId, "x");
    b.connect(gi.centerY, center.nodeId, "y");

    // The legacy effect interprets `intensity` as half an arc in [0, π]
    // (arc = intensity·π, sampled in ±half-arc steps). The sampler's
    // angular mode treats `amount` directly as ± radians, so we pre-scale
    // intensity by π to keep the visual scale similar.
    const amount = b.add("math", { op: "mul" }, { b: Math.PI });
    b.connect(gi.intensity, amount.nodeId, "a");

    const sampler = b.add(
      "sampler",
      { mode: "angular", samples: 32, edges: "stretch" },
    );
    b.connect(uv, sampler.nodeId, "uv");
    b.connect(amount, sampler.nodeId, "amount");
    b.connect(center, sampler.nodeId, "center");

    const passthrough = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, passthrough.nodeId, "uv");

    return b.output(sampler, { nodeId: passthrough.nodeId, pin: "alpha" });
  }
}

register(AngularBlur);
export default AngularBlur;
