// Pixelate — graph-decomposed. Snap UV to a `cells × cells` lattice via
// the `pixelate` primitive, then sample the previous pass at the snapped
// UV. The gap/rounded-corner mask uses the per-cell fract offset and a
// rounded-rect signed-distance mask via `mask:rect`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Pixelate",
  description: "Reduce resolution to discrete cells with optional gap",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Pixelate extends ProceduralEffect {
  static readonly typeId = "pixelate";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "cells", type: "float", label: "Cells", default: 80 },
      { id: "gap", type: "float", label: "Gap", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const cellsV = b.add(new N.CombineXy());
    b.connect(gi.cells).to(cellsV, "x");
    b.connect(gi.cells).to(cellsV, "y");

    const snapped = b.add(new N.Pixelate());
    b.connect(uv).to(snapped, "uv");
    b.connect(cellsV).to(snapped, "cells");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(snapped).to(sample, "uv");

    // cellUv = fract(uv · cells); use mask:rect centred at (0.5, 0.5) with
    // half-extent (0.5 − gap) to gate the per-cell area.
    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const fx = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "x").to(fx, "a");
    b.connect(gi.cells).to(fx, "b");
    const fy = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "y").to(fy, "a");
    b.connect(gi.cells).to(fy, "b");
    const fxF = b.add(new N.Math({ op: "fract" }));
    b.connect(fx).to(fxF, "x");
    const fyF = b.add(new N.Math({ op: "fract" }));
    b.connect(fy).to(fyF, "x");
    const cellUv = b.add(new N.CombineXy());
    b.connect(fxF).to(cellUv, "x");
    b.connect(fyF).to(cellUv, "y");

    const halfExtent = b.add(new N.Math({ op: "sub" }), { a: 0.5 });
    b.connect(gi.gap).to(halfExtent, "b");

    const half = b.add(new N.Const({ value: 0.5 }));
    const halfV = b.add(new N.CombineXy());
    b.connect(half).to(halfV, "x");
    b.connect(half).to(halfV, "y");

    const mask = b.add(new N.Mask({ shape: "rect" }));
    b.connect(cellUv).to(mask, "uv");
    b.connect(halfV).to(mask, "center");
    b.connect(halfExtent).to(mask, "radius");
    b.connect(b.add(new N.Const({ value: 0.01 }))).to(mask, "softness");

    // out alpha = sample.alpha · mask
    const aOut = b.add(new N.Math({ op: "mul" }));
    b.connect(sample, "alpha").to(aOut, "a");
    b.connect(mask).to(aOut, "b");

    return b.output({ nodeId: sample.nodeId, pin: "color" }, aOut);
  }
}

register(Pixelate);
export default Pixelate;
