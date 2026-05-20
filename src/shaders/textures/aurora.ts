import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Aurora",
  description: "Layered curtains of light",
  color: "#22ee88",
  category: "textures",
  defaultBlendMode: "normal",
};

// Aurora: thin wrapper around the `aurora-texture` primitive. Every
// shaders.com Aurora prop is surfaced as a GroupInput pin so the layer's
// property pane drives them directly; the primitive owns the unrolled curtain
// loop, ray modulation, and depth-graded three-colour ramp. `colorSpace` is
// an int pin (0=linear, 1=oklch, 2=oklab, 3=hsl, 4=hsv, 5=lch) — the graph
// system has no enum pin type yet, so the property pane renders it as a
// 0–5 scrubber. The composite output is mixed onto black via alpha so the
// transparent regions read against the procedural-field background, matching
// every other composite-output preset (floating-particles, strands).
export class Aurora extends ProceduralShader {
  static readonly typeId = "aurora";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "colorA", type: "vec3", label: "Color 1", default: [0.65, 0.2, 0.97] },
      { id: "colorB", type: "vec3", label: "Color 2", default: [0.13, 0.93, 0.53] },
      { id: "colorC", type: "vec3", label: "Color 3", default: [0.09, 0.58, 0.91] },
      { id: "balance", type: "float", label: "Balance", default: 50 },
      { id: "intensity", type: "float", label: "Intensity", default: 80 },
      { id: "curtainCount", type: "int", label: "Curtain Count", default: 4 },
      { id: "speed", type: "float", label: "Speed", default: 5 },
      { id: "waviness", type: "float", label: "Waviness", default: 50 },
      { id: "rayDensity", type: "float", label: "Ray Density", default: 20 },
      { id: "height", type: "float", label: "Height", default: 120 },
      { id: "center", type: "vec2", label: "Center", default: [0.5, 0] },
      { id: "seed", type: "float", label: "Seed", default: 0 },
      { id: "colorSpace", type: "int", label: "Color Space", default: 0 },
    ]);
    // `aurora-texture` is the only node type without a static class — it's
    // a legacy stub referenced here for forward compatibility. Routed through
    // the explicit dynamic-typeId escape hatch.
    const au = b.addByTypeId("aurora-texture");
    for (const id of [
      "colorA",
      "colorB",
      "colorC",
      "balance",
      "intensity",
      "curtainCount",
      "speed",
      "waviness",
      "rayDensity",
      "height",
      "center",
      "seed",
      "colorSpace",
    ] as const) {
      b.connect(gi[id]).to(au, id);
    }
    const mix = b.add(new N.MixColor());
    b.connect(au, "color").to(mix, "b");
    b.connect(au, "alpha").to(mix, "t");
    return b.output(mix);
  }
}

register(Aurora);
export default Aurora;
