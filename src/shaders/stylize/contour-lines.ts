// ContourLines — graph-decomposed. A single-octave simplex sample produces
// the height field; `abs(fract(n·freq) − 0.5) · 2` builds isolines that
// taper across `thickness + softness` via smoothstep.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Contour Lines",
  description: "Topographic contour lines from noise",
  color: "#84cc16",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class ContourLines extends ProceduralEffect {
  static readonly typeId = "contour-lines";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "colorBack", type: "vec3", label: "Background", default: [0.02, 0.04, 0.05] },
      { id: "colorFront", type: "vec3", label: "Lines", default: [0.55, 0.95, 0.7] },
      { id: "scale", type: "float", label: "Scale", default: 3 },
      { id: "frequency", type: "float", label: "Line Frequency", default: 5 },
      { id: "thickness", type: "float", label: "Thickness", default: 0.5 },
      { id: "softness", type: "float", label: "Softness", default: 0.3 },
      { id: "speed", type: "float", label: "Speed", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    // p = (uv − 0.5) — centred coords.
    const half = b.add(new N.Const({ value: 0.5 }));
    const halfV = b.add(new N.CombineXy());
    b.connect(half).to(halfV, "x");
    b.connect(half).to(halfV, "y");
    const centred = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(centred, "a");
    b.connect(halfV).to(centred, "b");

    // q = centred · scale
    const q = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(centred).to(q, "a");
    b.connect(gi.scale).to(q, "b");

    // time offset: t · speed · 0.3
    const tOff = b.add(new N.Math({ op: "mul" }), { b: 0.3 });
    const tScaled = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(tScaled, "a");
    b.connect(gi.speed).to(tScaled, "b");
    b.connect(tScaled).to(tOff, "a");

    const n = b.add(new N.NoiseTexture({
      kind: "simplex",
      scale: 1,
      seed: 0,
      detail: 5,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
    }));
    b.connect(q).to(n, "p");
    b.connect(tOff).to(n, "t");

    // lines = abs(fract(n · freq) − 0.5) · 2
    const ringed = b.add(new N.Math({ op: "mul" }));
    b.connect(n).to(ringed, "a");
    b.connect(gi.frequency).to(ringed, "b");
    const fr = b.add(new N.Math({ op: "fract" }));
    b.connect(ringed).to(fr, "x");
    const fm = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(fr).to(fm, "a");
    const ab = b.add(new N.Math({ op: "abs" }));
    b.connect(fm).to(ab, "x");
    const lines = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(ab).to(lines, "a");

    // halfWidth = thickness · 0.5
    const halfW = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(gi.thickness).to(halfW, "a");
    // soft = softness · 0.5
    const soft = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(gi.softness).to(soft, "a");
    // edge1 = halfWidth + soft
    const edge1 = b.add(new N.Math({ op: "add" }));
    b.connect(halfW).to(edge1, "a");
    b.connect(soft).to(edge1, "b");

    const ss = b.add(new N.Smoothstep());
    b.connect(halfW).to(ss, "edge0");
    b.connect(edge1).to(ss, "edge1");
    b.connect(lines).to(ss, "x");

    const m = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(m, "x");

    const mixed = b.add(new N.MixColor());
    b.connect(gi.colorBack).to(mixed, "a");
    b.connect(gi.colorFront).to(mixed, "b");
    b.connect(m).to(mixed, "t");

    // Alpha is always 1 in the legacy effect (paints a fully-opaque overlay).
    const one = b.add(new N.Const({ value: 1 }));
    return b.output(mixed, one);
  }
}

register(ContourLines);
export default ContourLines;
