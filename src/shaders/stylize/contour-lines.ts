// ContourLines — graph-decomposed. A single-octave simplex sample produces
// the height field; `abs(fract(n·freq) − 0.5) · 2` builds isolines that
// taper across `thickness + softness` via smoothstep.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    // p = (uv − 0.5) — centred coords.
    const half = b.add("value", { value: 0.5 });
    const halfV = b.add("combine-xy", {});
    b.connect(half, halfV.nodeId, "x");
    b.connect(half, halfV.nodeId, "y");
    const centred = b.add("vector-math", { op: "sub" });
    b.connect(uv, centred.nodeId, "a");
    b.connect(halfV, centred.nodeId, "b");

    // q = centred · scale
    const q = b.add("vector-math", { op: "scale" });
    b.connect(centred, q.nodeId, "a");
    b.connect(gi.scale, q.nodeId, "b");

    // time offset: t · speed · 0.3
    const tOff = b.add("math", { op: "mul" }, { b: 0.3 });
    const tScaled = b.add("math", { op: "mul" });
    b.connect(t, tScaled.nodeId, "a");
    b.connect(gi.speed, tScaled.nodeId, "b");
    b.connect(tScaled, tOff.nodeId, "a");

    const n = b.add("noise-texture", {
      kind: "simplex",
      scale: 1,
      seed: 0,
      detail: 5,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
    });
    b.connect(q, n.nodeId, "p");
    b.connect(tOff, n.nodeId, "t");

    // lines = abs(fract(n · freq) − 0.5) · 2
    const ringed = b.add("math", { op: "mul" });
    b.connect(n, ringed.nodeId, "a");
    b.connect(gi.frequency, ringed.nodeId, "b");
    const fr = b.add("math", { op: "fract" });
    b.connect(ringed, fr.nodeId, "x");
    const fm = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(fr, fm.nodeId, "a");
    const ab = b.add("math", { op: "abs" });
    b.connect(fm, ab.nodeId, "x");
    const lines = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(ab, lines.nodeId, "a");

    // halfWidth = thickness · 0.5
    const halfW = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gi.thickness, halfW.nodeId, "a");
    // soft = softness · 0.5
    const soft = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gi.softness, soft.nodeId, "a");
    // edge1 = halfWidth + soft
    const edge1 = b.add("math", { op: "add" });
    b.connect(halfW, edge1.nodeId, "a");
    b.connect(soft, edge1.nodeId, "b");

    const ss = b.add("smoothstep", {});
    b.connect(halfW, ss.nodeId, "edge0");
    b.connect(edge1, ss.nodeId, "edge1");
    b.connect(lines, ss.nodeId, "x");

    const m = b.add("math", { op: "oneminus" });
    b.connect(ss, m.nodeId, "x");

    const mixed = b.add("mix-color", {});
    b.connect(gi.colorBack, mixed.nodeId, "a");
    b.connect(gi.colorFront, mixed.nodeId, "b");
    b.connect(m, mixed.nodeId, "t");

    // Alpha is always 1 in the legacy effect (paints a fully-opaque overlay).
    const one = b.add("value", { value: 1 });
    return b.output(mixed, one);
  }
}

register(ContourLines);
export default ContourLines;
