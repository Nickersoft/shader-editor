// CursorTrail — graph-decomposed. The head and back-trail discs paint a
// `color`-tinted emit field; the previous frame is sampled and faded by
// `fade`; the trail accumulates as `max(faded, painted)` and adds onto
// the current sample. Uses the `prev-frame-sample` primitive to read
// `u_prevFrame`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Cursor Trail",
  description: "Glowing curved trail from a center point",
  color: "#facc15",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class CursorTrail extends GraphEffectBase {
  static readonly typeId = "cursor-trail";
  static readonly meta = meta;
  static readonly scope = "scene" as const;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "length", type: "float", label: "Length", default: 0.3 },
      { id: "width", type: "float", label: "Width", default: 0.05 },
      { id: "color", type: "vec3", label: "Color", default: [1, 0.9, 0.4] },
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "fade", type: "float", label: "Fade", default: 0.92 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const mousePos = b.add("mouse", {}, undefined, "position");
    const mouseDelta = b.add("mouse", {}, undefined, "delta");

    const src = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, src.nodeId, "uv");
    const prev = b.add("prev-frame-sample", {});
    b.connect(uv, prev.nodeId, "uv");

    // headDist = length(uv − cursor); head = 1 − smoothstep(0, width, dist)
    const headDist = b.add("vector-math", { op: "distance" });
    b.connect(uv, headDist.nodeId, "a");
    b.connect(mousePos, headDist.nodeId, "b");
    const headSS = b.add("smoothstep", {}, { edge0: 0 });
    b.connect(gi.width, headSS.nodeId, "edge1");
    b.connect(headDist, headSS.nodeId, "x");
    const head = b.add("math", { op: "oneminus" });
    b.connect(headSS, head.nodeId, "x");

    // trailLen = length(mouseDelta) · 100 · length
    const mdLen = b.add("vector-math", { op: "length" });
    b.connect(mouseDelta, mdLen.nodeId, "a");
    const mdLen100 = b.add("math", { op: "mul" }, { b: 100 });
    b.connect(mdLen, mdLen100.nodeId, "a");
    const trailLen = b.add("math", { op: "mul" });
    b.connect(mdLen100, trailLen.nodeId, "a");
    b.connect(gi.length, trailLen.nodeId, "b");

    // backTrail = cursor − normalize(mouseDelta + tiny) · trailLen
    const eps = b.add("combine-xy", {});
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "x");
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "y");
    const mdEps = b.add("vector-math", { op: "add" });
    b.connect(mouseDelta, mdEps.nodeId, "a");
    b.connect(eps, mdEps.nodeId, "b");
    const mdDir = b.add("vector-math", { op: "normalize" });
    b.connect(mdEps, mdDir.nodeId, "a");
    const backOff = b.add("vector-math", { op: "scale" });
    b.connect(mdDir, backOff.nodeId, "a");
    b.connect(trailLen, backOff.nodeId, "b");
    const backTrail = b.add("vector-math", { op: "sub" });
    b.connect(mousePos, backTrail.nodeId, "a");
    b.connect(backOff, backTrail.nodeId, "b");

    // trail = 1 − smoothstep(0, width · 1.5, length(uv − backTrail))
    const backDist = b.add("vector-math", { op: "distance" });
    b.connect(uv, backDist.nodeId, "a");
    b.connect(backTrail, backDist.nodeId, "b");
    const widthScaled = b.add("math", { op: "mul" }, { b: 1.5 });
    b.connect(gi.width, widthScaled.nodeId, "a");
    const trailSS = b.add("smoothstep", {}, { edge0: 0 });
    b.connect(widthScaled, trailSS.nodeId, "edge1");
    b.connect(backDist, trailSS.nodeId, "x");
    const trail = b.add("math", { op: "oneminus" });
    b.connect(trailSS, trail.nodeId, "x");

    // emit = max(head, trail · 0.5) · intensity
    const trail5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(trail, trail5.nodeId, "a");
    const emitRaw = b.add("math", { op: "max" });
    b.connect(head, emitRaw.nodeId, "a");
    b.connect(trail5, emitRaw.nodeId, "b");
    const emit = b.add("math", { op: "mul" });
    b.connect(emitRaw, emit.nodeId, "a");
    b.connect(gi.intensity, emit.nodeId, "b");

    // painted = color · emit
    const painted = b.add("color-math", { op: "scale" });
    b.connect(gi.color, painted.nodeId, "a");
    b.connect(emit, painted.nodeId, "b");

    // faded = prev.rgb · fade
    const faded = b.add("color-math", { op: "scale" });
    b.connect({ nodeId: prev.nodeId, pin: "color" }, faded.nodeId, "a");
    b.connect(gi.fade, faded.nodeId, "b");

    // trailRgb = max(faded, painted)
    const trailRgb = b.add("color-math", { op: "max" });
    b.connect(faded, trailRgb.nodeId, "a");
    b.connect(painted, trailRgb.nodeId, "b");

    // out.rgb = src.rgb + trailRgb
    const outRgb = b.add("color-math", { op: "add" });
    b.connect({ nodeId: src.nodeId, pin: "color" }, outRgb.nodeId, "a");
    b.connect(trailRgb, outRgb.nodeId, "b");

    // out.a = max(src.a, max(prev.a · fade, emit))
    const prevFade = b.add("math", { op: "mul" });
    b.connect({ nodeId: prev.nodeId, pin: "alpha" }, prevFade.nodeId, "a");
    b.connect(gi.fade, prevFade.nodeId, "b");
    const aMid = b.add("math", { op: "max" });
    b.connect(prevFade, aMid.nodeId, "a");
    b.connect(emit, aMid.nodeId, "b");
    const aOut = b.add("math", { op: "max" });
    b.connect({ nodeId: src.nodeId, pin: "alpha" }, aOut.nodeId, "a");
    b.connect(aMid, aOut.nodeId, "b");

    return b.output(outRgb, aOut);
  }
}

register(CursorTrail);
export default CursorTrail;
