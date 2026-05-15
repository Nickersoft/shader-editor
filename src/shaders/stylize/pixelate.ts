// Pixelate — graph-decomposed. Snap UV to a `cells × cells` lattice via
// the `pixelate` primitive, then sample the previous pass at the snapped
// UV. The gap/rounded-corner mask uses the per-cell fract offset and a
// rounded-rect signed-distance mask via `mask:rect`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Pixelate",
  description: "Reduce resolution to discrete cells with optional gap",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Pixelate extends GraphEffectBase {
  static readonly typeId = "pixelate";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "cells", type: "float", label: "Cells", default: 80 },
      { id: "gap", type: "float", label: "Gap", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const cellsV = b.add("combine-xy", {});
    b.connect(gi.cells, cellsV.nodeId, "x");
    b.connect(gi.cells, cellsV.nodeId, "y");

    const snapped = b.add("pixelate", {});
    b.connect(uv, snapped.nodeId, "uv");
    b.connect(cellsV, snapped.nodeId, "cells");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(snapped, sample.nodeId, "uv");

    // cellUv = fract(uv · cells); use mask:rect centred at (0.5, 0.5) with
    // half-extent (0.5 − gap) to gate the per-cell area.
    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const fx = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "x" }, fx.nodeId, "a");
    b.connect(gi.cells, fx.nodeId, "b");
    const fy = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, fy.nodeId, "a");
    b.connect(gi.cells, fy.nodeId, "b");
    const fxF = b.add("math", { op: "fract" });
    b.connect(fx, fxF.nodeId, "x");
    const fyF = b.add("math", { op: "fract" });
    b.connect(fy, fyF.nodeId, "x");
    const cellUv = b.add("combine-xy", {});
    b.connect(fxF, cellUv.nodeId, "x");
    b.connect(fyF, cellUv.nodeId, "y");

    const halfExtent = b.add("math", { op: "sub" }, { a: 0.5 });
    b.connect(gi.gap, halfExtent.nodeId, "b");

    const half = b.add("value", { value: 0.5 });
    const halfV = b.add("combine-xy", {});
    b.connect(half, halfV.nodeId, "x");
    b.connect(half, halfV.nodeId, "y");

    const mask = b.add("mask", { shape: "rect" });
    b.connect(cellUv, mask.nodeId, "uv");
    b.connect(halfV, mask.nodeId, "center");
    b.connect(halfExtent, mask.nodeId, "radius");
    b.connect(b.add("value", { value: 0.01 }), mask.nodeId, "softness");

    // out alpha = sample.alpha · mask
    const aOut = b.add("math", { op: "mul" });
    b.connect({ nodeId: sample.nodeId, pin: "alpha" }, aOut.nodeId, "a");
    b.connect(mask, aOut.nodeId, "b");

    return b.output({ nodeId: sample.nodeId, pin: "color" }, aOut);
  }
}

register(Pixelate);
export default Pixelate;
