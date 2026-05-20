// FlutedGlass — graph-decomposed refractive vertical fluting.
//   t = sin(uv.x · frequency · π)
//   ts = sign(t) · |t|^(mix(1, 0.3, softness))
//   refrX = ts · refraction · 0.05
//   finalUV = (uv.x + refrX, uv.y)
//   chr = ts · aberration · 0.025
//   sample R at (finalUV.x + chr, finalUV.y), G at finalUV, B at (finalUV.x − chr, finalUV.y)
//   spec = pow(max(1 − |t|, 0), 1/max(highlightSoftness, 0.01)) · highlight · max(cos(lightAngle − uv.x · π), 0)
//   lit = mix(sampledRGB, highlightColor, clamp(spec, 0, 1))

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Fluted Glass",
  description: "Refractive vertical fluting with chromatic aberration and highlight",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class FlutedGlass extends ProceduralEffect {
  static readonly typeId = "fluted-glass";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "frequency", type: "float", label: "Frequency", default: 8 },
      { id: "softness", type: "float", label: "Softness", default: 0.5 },
      { id: "refraction", type: "float", label: "Refraction", default: 0.5 },
      { id: "aberration", type: "float", label: "Aberration", default: 0 },
      { id: "lightAngle", type: "float", label: "Light Angle", default: 45 },
      { id: "highlight", type: "float", label: "Highlight", default: 0.5 },
      {
        id: "highlightSoftness",
        type: "float",
        label: "Highlight Softness",
        default: 0.5,
      },
      {
        id: "highlightColor",
        type: "vec3",
        label: "Highlight Color",
        default: [1, 1, 1],
      },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const split = b.add(new N.SeparateXy());
    b.connect(uv).to(split, "v");
    const uvx = { nodeId: split.nodeId, pin: "x" };
    const uvy = { nodeId: split.nodeId, pin: "y" };

    const pi = b.add(new N.Const({ value: Math.PI }));
    const uvxFreq = b.add(new N.Math({ op: "mul" }));
    b.connect(uvx).to(uvxFreq, "a");
    b.connect(gi.frequency).to(uvxFreq, "b");
    const uvxFreqPi = b.add(new N.Math({ op: "mul" }));
    b.connect(uvxFreq).to(uvxFreqPi, "a");
    b.connect(pi).to(uvxFreqPi, "b");
    const tSin = b.add(new N.Math({ op: "sin" }));
    b.connect(uvxFreqPi).to(tSin, "x");

    // ts = sign(t) · |t|^(mix(1, 0.3, softness))
    const sgn = b.add(new N.Math({ op: "sign" }));
    b.connect(tSin).to(sgn, "x");
    const absT = b.add(new N.Math({ op: "abs" }));
    b.connect(tSin).to(absT, "x");
    // exp = 1 + (0.3 - 1) · softness = 1 - 0.7 · softness
    const minus07 = b.add(new N.Const({ value: -0.7 }));
    const oneV = b.add(new N.Const({ value: 1 }));
    const softTerm = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.softness).to(softTerm, "a");
    b.connect(minus07).to(softTerm, "b");
    const expVal = b.add(new N.Math({ op: "add" }));
    b.connect(oneV).to(expVal, "a");
    b.connect(softTerm).to(expVal, "b");
    const powT = b.add(new N.Math({ op: "pow" }));
    b.connect(absT).to(powT, "a");
    b.connect(expVal).to(powT, "b");
    const ts = b.add(new N.Math({ op: "mul" }));
    b.connect(sgn).to(ts, "a");
    b.connect(powT).to(ts, "b");

    // refrX = ts · refraction · 0.05
    const c05 = b.add(new N.Const({ value: 0.05 }));
    const refrMul = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.refraction).to(refrMul, "a");
    b.connect(c05).to(refrMul, "b");
    const refrX = b.add(new N.Math({ op: "mul" }));
    b.connect(ts).to(refrX, "a");
    b.connect(refrMul).to(refrX, "b");

    // finalUV
    const finalX = b.add(new N.Math({ op: "add" }));
    b.connect(uvx).to(finalX, "a");
    b.connect(refrX).to(finalX, "b");
    const finalUv = b.add(new N.CombineXy());
    b.connect(finalX).to(finalUv, "x");
    b.connect(uvy).to(finalUv, "y");

    // chr = ts · aberration · 0.025
    const c025 = b.add(new N.Const({ value: 0.025 }));
    const abMul = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.aberration).to(abMul, "a");
    b.connect(c025).to(abMul, "b");
    const chr = b.add(new N.Math({ op: "mul" }));
    b.connect(ts).to(chr, "a");
    b.connect(abMul).to(chr, "b");

    // Per-channel sample UVs.
    const rX = b.add(new N.Math({ op: "add" }));
    b.connect(finalX).to(rX, "a");
    b.connect(chr).to(rX, "b");
    const rUv = b.add(new N.CombineXy());
    b.connect(rX).to(rUv, "x");
    b.connect(uvy).to(rUv, "y");

    const bX = b.add(new N.Math({ op: "sub" }));
    b.connect(finalX).to(bX, "a");
    b.connect(chr).to(bX, "b");
    const bUv = b.add(new N.CombineXy());
    b.connect(bX).to(bUv, "x");
    b.connect(uvy).to(bUv, "y");

    const sampleR = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(rUv).to(sampleR, "uv");
    const sampleG = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(finalUv).to(sampleG, "uv");
    const sampleB = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(bUv).to(sampleB, "uv");

    // Recombine: sampled.rgb = vec3(R.r, G.g, B.b)
    const splitR = b.add(new N.SeparateColor());
    b.connect(sampleR, "color").to(splitR, "v");
    const splitG = b.add(new N.SeparateColor());
    b.connect(sampleG, "color").to(splitG, "v");
    const splitB = b.add(new N.SeparateColor());
    b.connect(sampleB, "color").to(splitB, "v");
    const sampled = b.add(new N.CombineColor());
    b.connect(splitR, "r").to(sampled, "r");
    b.connect(splitG, "g").to(sampled, "g");
    b.connect(splitB, "b").to(sampled, "b");

    // spec = pow(max(1 − |t|, 0), 1/max(highlightSoftness, 0.01)) · highlight · max(cos(lightAngle·π/180 − uv.x · π), 0)
    const oneMinusAbsT = b.add(new N.Math({ op: "sub" }));
    b.connect(oneV).to(oneMinusAbsT, "a");
    b.connect(absT).to(oneMinusAbsT, "b");
    const zeroV = b.add(new N.Const({ value: 0 }));
    const oneMinusAbsTclamp = b.add(new N.Math({ op: "max" }));
    b.connect(zeroV).to(oneMinusAbsTclamp, "a");
    b.connect(oneMinusAbsT).to(oneMinusAbsTclamp, "b");
    const c001 = b.add(new N.Const({ value: 0.01 }));
    const safeHS = b.add(new N.Math({ op: "max" }));
    b.connect(gi.highlightSoftness).to(safeHS, "a");
    b.connect(c001).to(safeHS, "b");
    const softInv = b.add(new N.Math({ op: "div" }));
    b.connect(oneV).to(softInv, "a");
    b.connect(safeHS).to(softInv, "b");
    const specBase = b.add(new N.Math({ op: "pow" }));
    b.connect(oneMinusAbsTclamp).to(specBase, "a");
    b.connect(softInv).to(specBase, "b");
    const specHigh = b.add(new N.Math({ op: "mul" }));
    b.connect(specBase).to(specHigh, "a");
    b.connect(gi.highlight).to(specHigh, "b");

    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const laR = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.lightAngle).to(laR, "a");
    b.connect(deg2rad).to(laR, "b");
    const uvxPi = b.add(new N.Math({ op: "mul" }));
    b.connect(uvx).to(uvxPi, "a");
    b.connect(pi).to(uvxPi, "b");
    const dLight = b.add(new N.Math({ op: "sub" }));
    b.connect(laR).to(dLight, "a");
    b.connect(uvxPi).to(dLight, "b");
    const cosLight = b.add(new N.Math({ op: "cos" }));
    b.connect(dLight).to(cosLight, "x");
    const lightFactor = b.add(new N.Math({ op: "max" }));
    b.connect(cosLight).to(lightFactor, "a");
    b.connect(zeroV).to(lightFactor, "b");

    const spec = b.add(new N.Math({ op: "mul" }));
    b.connect(specHigh).to(spec, "a");
    b.connect(lightFactor).to(spec, "b");

    const lit = b.add(new N.MixColor({ clampT: true }));
    b.connect(sampled).to(lit, "a");
    b.connect(gi.highlightColor).to(lit, "b");
    b.connect(spec).to(lit, "t");

    return b.output(lit, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(FlutedGlass);
export default FlutedGlass;
