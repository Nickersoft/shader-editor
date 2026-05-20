// RectangularCoordinates — graph-decomposed Fernandez-Guasti square↔circle map.
//   p = (uv − c) · 2
//   u = p.x · sqrt(max(1 − p.y²·0.5, 0))
//   v = p.y · sqrt(max(1 − p.x²·0.5, 0))
//   mapped = c + vec2(u, v) · 0.5
//   finalUV = mix(uv, mapped, intensity)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Rectangular Coordinates",
  description: "Square ↔ circle remap via Fernandez-Guasti mapping",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class RectangularCoordinates extends ProceduralEffect {
  static readonly typeId = "rectangular-coordinates";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const c = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(c, "x");
    b.connect(gi.centerY).to(c, "y");

    const two = b.add(new N.Const({ value: 2 }));
    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(c).to(d, "b");
    const p = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(d).to(p, "a");
    b.connect(two).to(p, "b");

    const split = b.add(new N.SeparateXy());
    b.connect(p).to(split, "v");
    const px = { nodeId: split.nodeId, pin: "x" };
    const py = { nodeId: split.nodeId, pin: "y" };

    // sqrt(max(1 − p.y²·0.5, 0)) — math.sqrt clamps to >= 0 internally.
    const half = b.add(new N.Const({ value: 0.5 }));
    const one = b.add(new N.Const({ value: 1 }));
    const py2 = b.add(new N.Math({ op: "mul" }));
    b.connect(py).to(py2, "a");
    b.connect(py).to(py2, "b");
    const halfPy2 = b.add(new N.Math({ op: "mul" }));
    b.connect(py2).to(halfPy2, "a");
    b.connect(half).to(halfPy2, "b");
    const oneMinus = b.add(new N.Math({ op: "sub" }));
    b.connect(one).to(oneMinus, "a");
    b.connect(halfPy2).to(oneMinus, "b");
    const sX = b.add(new N.Math({ op: "sqrt" }));
    b.connect(oneMinus).to(sX, "x");
    const uX = b.add(new N.Math({ op: "mul" }));
    b.connect(px).to(uX, "a");
    b.connect(sX).to(uX, "b");

    const px2 = b.add(new N.Math({ op: "mul" }));
    b.connect(px).to(px2, "a");
    b.connect(px).to(px2, "b");
    const halfPx2 = b.add(new N.Math({ op: "mul" }));
    b.connect(px2).to(halfPx2, "a");
    b.connect(half).to(halfPx2, "b");
    const oneMinusX = b.add(new N.Math({ op: "sub" }));
    b.connect(one).to(oneMinusX, "a");
    b.connect(halfPx2).to(oneMinusX, "b");
    const sY = b.add(new N.Math({ op: "sqrt" }));
    b.connect(oneMinusX).to(sY, "x");
    const vY = b.add(new N.Math({ op: "mul" }));
    b.connect(py).to(vY, "a");
    b.connect(sY).to(vY, "b");

    const uvCircle = b.add(new N.CombineXy());
    b.connect(uX).to(uvCircle, "x");
    b.connect(vY).to(uvCircle, "y");
    const halfV = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uvCircle).to(halfV, "a");
    b.connect(half).to(halfV, "b");
    const mapped = b.add(new N.VectorMath({ op: "add" }));
    b.connect(c).to(mapped, "a");
    b.connect(halfV).to(mapped, "b");

    // mix(uv, mapped, intensity) component-wise. The vector-math primitive has
    // no `mix` op; we lerp by hand: diff · intensity + uv.
    const diff = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(mapped).to(diff, "a");
    b.connect(uv).to(diff, "b");
    const scaledDiff = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(diff).to(scaledDiff, "a");
    b.connect(gi.intensity).to(scaledDiff, "b");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(finalUv, "a");
    b.connect(scaledDiff).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(RectangularCoordinates);
export default RectangularCoordinates;
