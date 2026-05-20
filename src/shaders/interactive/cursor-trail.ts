// CursorTrail — graph-decomposed. The head and back-trail discs paint a
// `color`-tinted emit field; the previous frame is sampled and faded by
// `fade`; the trail accumulates as `max(faded, painted)` and adds onto
// the current sample. Uses the `prev-frame-sample` primitive to read
// `u_prevFrame`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Cursor Trail",
  description: "Glowing curved trail from a center point",
  color: "#facc15",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class CursorTrail extends ProceduralEffect {
  static readonly typeId = "cursor-trail";
  static readonly meta = meta;
  static readonly scope = "scene" as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "length", type: "float", label: "Length", default: 0.3 },
      { id: "width", type: "float", label: "Width", default: 0.05 },
      { id: "color", type: "vec3", label: "Color", default: [1, 0.9, 0.4] },
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "fade", type: "float", label: "Fade", default: 0.92 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const mousePos = b.add(new N.Mouse(), undefined, "position");
    const mouseDelta = b.add(new N.Mouse(), undefined, "delta");

    const src = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(src, "uv");
    const prev = b.add(new N.PrevFrameSample());
    b.connect(uv).to(prev, "uv");

    // headDist = length(uv − cursor); head = 1 − smoothstep(0, width, dist)
    const headDist = b.add(new N.VectorMath({ op: "distance" }));
    b.connect(uv).to(headDist, "a");
    b.connect(mousePos).to(headDist, "b");
    const headSS = b.add(new N.Smoothstep(), { edge0: 0 });
    b.connect(gi.width).to(headSS, "edge1");
    b.connect(headDist).to(headSS, "x");
    const head = b.add(new N.Math({ op: "oneminus" }));
    b.connect(headSS).to(head, "x");

    // trailLen = length(mouseDelta) · 100 · length
    const mdLen = b.add(new N.VectorMath({ op: "length" }));
    b.connect(mouseDelta).to(mdLen, "a");
    const mdLen100 = b.add(new N.Math({ op: "mul" }), { b: 100 });
    b.connect(mdLen).to(mdLen100, "a");
    const trailLen = b.add(new N.Math({ op: "mul" }));
    b.connect(mdLen100).to(trailLen, "a");
    b.connect(gi.length).to(trailLen, "b");

    // backTrail = cursor − normalize(mouseDelta + tiny) · trailLen
    const eps = b.add(new N.CombineXy());
    b.connect(b.add(new N.Const({ value: 1e-5 }))).to(eps, "x");
    b.connect(b.add(new N.Const({ value: 1e-5 }))).to(eps, "y");
    const mdEps = b.add(new N.VectorMath({ op: "add" }));
    b.connect(mouseDelta).to(mdEps, "a");
    b.connect(eps).to(mdEps, "b");
    const mdDir = b.add(new N.VectorMath({ op: "normalize" }));
    b.connect(mdEps).to(mdDir, "a");
    const backOff = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(mdDir).to(backOff, "a");
    b.connect(trailLen).to(backOff, "b");
    const backTrail = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(mousePos).to(backTrail, "a");
    b.connect(backOff).to(backTrail, "b");

    // trail = 1 − smoothstep(0, width · 1.5, length(uv − backTrail))
    const backDist = b.add(new N.VectorMath({ op: "distance" }));
    b.connect(uv).to(backDist, "a");
    b.connect(backTrail).to(backDist, "b");
    const widthScaled = b.add(new N.Math({ op: "mul" }), { b: 1.5 });
    b.connect(gi.width).to(widthScaled, "a");
    const trailSS = b.add(new N.Smoothstep(), { edge0: 0 });
    b.connect(widthScaled).to(trailSS, "edge1");
    b.connect(backDist).to(trailSS, "x");
    const trail = b.add(new N.Math({ op: "oneminus" }));
    b.connect(trailSS).to(trail, "x");

    // emit = max(head, trail · 0.5) · intensity
    const trail5 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(trail).to(trail5, "a");
    const emitRaw = b.add(new N.Math({ op: "max" }));
    b.connect(head).to(emitRaw, "a");
    b.connect(trail5).to(emitRaw, "b");
    const emit = b.add(new N.Math({ op: "mul" }));
    b.connect(emitRaw).to(emit, "a");
    b.connect(gi.intensity).to(emit, "b");

    // painted = color · emit
    const painted = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(gi.color).to(painted, "a");
    b.connect(emit).to(painted, "b");

    // faded = prev.rgb · fade
    const faded = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(prev, "color").to(faded, "a");
    b.connect(gi.fade).to(faded, "b");

    // trailRgb = max(faded, painted)
    const trailRgb = b.add(new N.ColorMath({ op: "max" }));
    b.connect(faded).to(trailRgb, "a");
    b.connect(painted).to(trailRgb, "b");

    // out.rgb = src.rgb + trailRgb
    const outRgb = b.add(new N.ColorMath({ op: "add" }));
    b.connect(src, "color").to(outRgb, "a");
    b.connect(trailRgb).to(outRgb, "b");

    // out.a = max(src.a, max(prev.a · fade, emit))
    const prevFade = b.add(new N.Math({ op: "mul" }));
    b.connect(prev, "alpha").to(prevFade, "a");
    b.connect(gi.fade).to(prevFade, "b");
    const aMid = b.add(new N.Math({ op: "max" }));
    b.connect(prevFade).to(aMid, "a");
    b.connect(emit).to(aMid, "b");
    const aOut = b.add(new N.Math({ op: "max" }));
    b.connect(src, "alpha").to(aOut, "a");
    b.connect(aMid).to(aOut, "b");

    return b.output(outRgb, aOut);
  }
}

register(CursorTrail);
export default CursorTrail;
