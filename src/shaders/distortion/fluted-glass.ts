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
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const split = b.add("separate-xy", {});
    b.connect(uv, split.nodeId, "v");
    const uvx = { nodeId: split.nodeId, pin: "x" };
    const uvy = { nodeId: split.nodeId, pin: "y" };

    const pi = b.add("value", { value: Math.PI });
    const uvxFreq = b.add("math", { op: "mul" });
    b.connect(uvx, uvxFreq.nodeId, "a");
    b.connect(gi.frequency, uvxFreq.nodeId, "b");
    const uvxFreqPi = b.add("math", { op: "mul" });
    b.connect(uvxFreq, uvxFreqPi.nodeId, "a");
    b.connect(pi, uvxFreqPi.nodeId, "b");
    const tSin = b.add("math", { op: "sin" });
    b.connect(uvxFreqPi, tSin.nodeId, "x");

    // ts = sign(t) · |t|^(mix(1, 0.3, softness))
    const sgn = b.add("math", { op: "sign" });
    b.connect(tSin, sgn.nodeId, "x");
    const absT = b.add("math", { op: "abs" });
    b.connect(tSin, absT.nodeId, "x");
    // exp = 1 + (0.3 - 1) · softness = 1 - 0.7 · softness
    const minus07 = b.add("value", { value: -0.7 });
    const oneV = b.add("value", { value: 1 });
    const softTerm = b.add("math", { op: "mul" });
    b.connect(gi.softness, softTerm.nodeId, "a");
    b.connect(minus07, softTerm.nodeId, "b");
    const expVal = b.add("math", { op: "add" });
    b.connect(oneV, expVal.nodeId, "a");
    b.connect(softTerm, expVal.nodeId, "b");
    const powT = b.add("math", { op: "pow" });
    b.connect(absT, powT.nodeId, "a");
    b.connect(expVal, powT.nodeId, "b");
    const ts = b.add("math", { op: "mul" });
    b.connect(sgn, ts.nodeId, "a");
    b.connect(powT, ts.nodeId, "b");

    // refrX = ts · refraction · 0.05
    const c05 = b.add("value", { value: 0.05 });
    const refrMul = b.add("math", { op: "mul" });
    b.connect(gi.refraction, refrMul.nodeId, "a");
    b.connect(c05, refrMul.nodeId, "b");
    const refrX = b.add("math", { op: "mul" });
    b.connect(ts, refrX.nodeId, "a");
    b.connect(refrMul, refrX.nodeId, "b");

    // finalUV
    const finalX = b.add("math", { op: "add" });
    b.connect(uvx, finalX.nodeId, "a");
    b.connect(refrX, finalX.nodeId, "b");
    const finalUv = b.add("combine-xy", {});
    b.connect(finalX, finalUv.nodeId, "x");
    b.connect(uvy, finalUv.nodeId, "y");

    // chr = ts · aberration · 0.025
    const c025 = b.add("value", { value: 0.025 });
    const abMul = b.add("math", { op: "mul" });
    b.connect(gi.aberration, abMul.nodeId, "a");
    b.connect(c025, abMul.nodeId, "b");
    const chr = b.add("math", { op: "mul" });
    b.connect(ts, chr.nodeId, "a");
    b.connect(abMul, chr.nodeId, "b");

    // Per-channel sample UVs.
    const rX = b.add("math", { op: "add" });
    b.connect(finalX, rX.nodeId, "a");
    b.connect(chr, rX.nodeId, "b");
    const rUv = b.add("combine-xy", {});
    b.connect(rX, rUv.nodeId, "x");
    b.connect(uvy, rUv.nodeId, "y");

    const bX = b.add("math", { op: "sub" });
    b.connect(finalX, bX.nodeId, "a");
    b.connect(chr, bX.nodeId, "b");
    const bUv = b.add("combine-xy", {});
    b.connect(bX, bUv.nodeId, "x");
    b.connect(uvy, bUv.nodeId, "y");

    const sampleR = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(rUv, sampleR.nodeId, "uv");
    const sampleG = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(finalUv, sampleG.nodeId, "uv");
    const sampleB = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(bUv, sampleB.nodeId, "uv");

    // Recombine: sampled.rgb = vec3(R.r, G.g, B.b)
    const splitR = b.add("separate-color", {});
    b.connect({ nodeId: sampleR.nodeId, pin: "color" }, splitR.nodeId, "v");
    const splitG = b.add("separate-color", {});
    b.connect({ nodeId: sampleG.nodeId, pin: "color" }, splitG.nodeId, "v");
    const splitB = b.add("separate-color", {});
    b.connect({ nodeId: sampleB.nodeId, pin: "color" }, splitB.nodeId, "v");
    const sampled = b.add("combine-color", {});
    b.connect({ nodeId: splitR.nodeId, pin: "r" }, sampled.nodeId, "r");
    b.connect({ nodeId: splitG.nodeId, pin: "g" }, sampled.nodeId, "g");
    b.connect({ nodeId: splitB.nodeId, pin: "b" }, sampled.nodeId, "b");

    // spec = pow(max(1 − |t|, 0), 1/max(highlightSoftness, 0.01)) · highlight · max(cos(lightAngle·π/180 − uv.x · π), 0)
    const oneMinusAbsT = b.add("math", { op: "sub" });
    b.connect(oneV, oneMinusAbsT.nodeId, "a");
    b.connect(absT, oneMinusAbsT.nodeId, "b");
    const zeroV = b.add("value", { value: 0 });
    const oneMinusAbsTclamp = b.add("math", { op: "max" });
    b.connect(zeroV, oneMinusAbsTclamp.nodeId, "a");
    b.connect(oneMinusAbsT, oneMinusAbsTclamp.nodeId, "b");
    const c001 = b.add("value", { value: 0.01 });
    const safeHS = b.add("math", { op: "max" });
    b.connect(gi.highlightSoftness, safeHS.nodeId, "a");
    b.connect(c001, safeHS.nodeId, "b");
    const softInv = b.add("math", { op: "div" });
    b.connect(oneV, softInv.nodeId, "a");
    b.connect(safeHS, softInv.nodeId, "b");
    const specBase = b.add("math", { op: "pow" });
    b.connect(oneMinusAbsTclamp, specBase.nodeId, "a");
    b.connect(softInv, specBase.nodeId, "b");
    const specHigh = b.add("math", { op: "mul" });
    b.connect(specBase, specHigh.nodeId, "a");
    b.connect(gi.highlight, specHigh.nodeId, "b");

    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const laR = b.add("math", { op: "mul" });
    b.connect(gi.lightAngle, laR.nodeId, "a");
    b.connect(deg2rad, laR.nodeId, "b");
    const uvxPi = b.add("math", { op: "mul" });
    b.connect(uvx, uvxPi.nodeId, "a");
    b.connect(pi, uvxPi.nodeId, "b");
    const dLight = b.add("math", { op: "sub" });
    b.connect(laR, dLight.nodeId, "a");
    b.connect(uvxPi, dLight.nodeId, "b");
    const cosLight = b.add("math", { op: "cos" });
    b.connect(dLight, cosLight.nodeId, "x");
    const lightFactor = b.add("math", { op: "max" });
    b.connect(cosLight, lightFactor.nodeId, "a");
    b.connect(zeroV, lightFactor.nodeId, "b");

    const spec = b.add("math", { op: "mul" });
    b.connect(specHigh, spec.nodeId, "a");
    b.connect(lightFactor, spec.nodeId, "b");

    const lit = b.add("mix-color", { clampT: true });
    b.connect(sampled, lit.nodeId, "a");
    b.connect(gi.highlightColor, lit.nodeId, "b");
    b.connect(spec, lit.nodeId, "t");

    return b.output(lit, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(FlutedGlass);
export default FlutedGlass;
