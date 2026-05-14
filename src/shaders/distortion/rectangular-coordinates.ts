// RectangularCoordinates — graph-decomposed Fernandez-Guasti square↔circle map.
//   p = (uv − c) · 2
//   u = p.x · sqrt(max(1 − p.y²·0.5, 0))
//   v = p.y · sqrt(max(1 − p.x²·0.5, 0))
//   mapped = c + vec2(u, v) · 0.5
//   finalUV = mix(uv, mapped, intensity)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Rectangular Coordinates",
  description: "Square ↔ circle remap via Fernandez-Guasti mapping",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class RectangularCoordinates extends GraphEffectBase {
  static readonly typeId = "rectangular-coordinates";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const c = b.add("combine-xy", {});
    b.connect(gi.centerX, c.nodeId, "x");
    b.connect(gi.centerY, c.nodeId, "y");

    const two = b.add("value", { value: 2 });
    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(c, d.nodeId, "b");
    const p = b.add("vector-math", { op: "scale" });
    b.connect(d, p.nodeId, "a");
    b.connect(two, p.nodeId, "b");

    const split = b.add("separate-xy", {});
    b.connect(p, split.nodeId, "v");
    const px = { nodeId: split.nodeId, pin: "x" };
    const py = { nodeId: split.nodeId, pin: "y" };

    // sqrt(max(1 − p.y²·0.5, 0)) — math.sqrt clamps to >= 0 internally.
    const half = b.add("value", { value: 0.5 });
    const one = b.add("value", { value: 1 });
    const py2 = b.add("math", { op: "mul" });
    b.connect(py, py2.nodeId, "a");
    b.connect(py, py2.nodeId, "b");
    const halfPy2 = b.add("math", { op: "mul" });
    b.connect(py2, halfPy2.nodeId, "a");
    b.connect(half, halfPy2.nodeId, "b");
    const oneMinus = b.add("math", { op: "sub" });
    b.connect(one, oneMinus.nodeId, "a");
    b.connect(halfPy2, oneMinus.nodeId, "b");
    const sX = b.add("math", { op: "sqrt" });
    b.connect(oneMinus, sX.nodeId, "x");
    const uX = b.add("math", { op: "mul" });
    b.connect(px, uX.nodeId, "a");
    b.connect(sX, uX.nodeId, "b");

    const px2 = b.add("math", { op: "mul" });
    b.connect(px, px2.nodeId, "a");
    b.connect(px, px2.nodeId, "b");
    const halfPx2 = b.add("math", { op: "mul" });
    b.connect(px2, halfPx2.nodeId, "a");
    b.connect(half, halfPx2.nodeId, "b");
    const oneMinusX = b.add("math", { op: "sub" });
    b.connect(one, oneMinusX.nodeId, "a");
    b.connect(halfPx2, oneMinusX.nodeId, "b");
    const sY = b.add("math", { op: "sqrt" });
    b.connect(oneMinusX, sY.nodeId, "x");
    const vY = b.add("math", { op: "mul" });
    b.connect(py, vY.nodeId, "a");
    b.connect(sY, vY.nodeId, "b");

    const uvCircle = b.add("combine-xy", {});
    b.connect(uX, uvCircle.nodeId, "x");
    b.connect(vY, uvCircle.nodeId, "y");
    const halfV = b.add("vector-math", { op: "scale" });
    b.connect(uvCircle, halfV.nodeId, "a");
    b.connect(half, halfV.nodeId, "b");
    const mapped = b.add("vector-math", { op: "add" });
    b.connect(c, mapped.nodeId, "a");
    b.connect(halfV, mapped.nodeId, "b");

    // mix(uv, mapped, intensity) component-wise. The vector-math primitive has
    // no `mix` op; we lerp by hand: diff · intensity + uv.
    const diff = b.add("vector-math", { op: "sub" });
    b.connect(mapped, diff.nodeId, "a");
    b.connect(uv, diff.nodeId, "b");
    const scaledDiff = b.add("vector-math", { op: "scale" });
    b.connect(diff, scaledDiff.nodeId, "a");
    b.connect(gi.intensity, scaledDiff.nodeId, "b");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(uv, finalUv.nodeId, "a");
    b.connect(scaledDiff, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "transparent" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(RectangularCoordinates);
export default RectangularCoordinates;
