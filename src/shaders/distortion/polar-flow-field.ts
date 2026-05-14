import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zCenterAxis, zEdges, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  mode: z.enum(["directional", "radial-dilate"]).default("radial-dilate").describe("Mode"),
  edges: zEdges().default("transparent").describe("Edges"),
});

const uniforms = z.object({
  centerX: zCenterAxis().default(0.5).describe("Center X"),
  centerY: zCenterAxis().default(0.5).describe("Center Y"),
  intensity: zFloat(0, 1, 0.01).default(0.5).describe("Intensity"),
  detail: zFloat(0, 5, 0.05).default(1.5).describe("Detail"),
  evolutionSpeed: zFloat(0, 2, 0.05).default(0.3).describe("Evolution Speed"),
  loopDuration: zFloat(0, 10, 0.1).default(0).describe("Loop Duration"),
});

const meta: NodeMeta = {
  name: "Polar Flow Field",
  description:
    "Noise-driven UV warp sampled in polar coordinates around a center; ideal for vortex, halo, and ring distortions",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class PolarFlowField extends EffectNode<Config, Uniforms> {
  static readonly typeId = "polar-flow-field";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const cx = this.uniformName("centerX");
    const cy = this.uniformName("centerY");
    const intensity = this.uniformName("intensity");
    const detail = this.uniformName("detail");
    const evolutionSpeed = this.uniformName("evolutionSpeed");
    const loopDuration = this.uniformName("loopDuration");

    // Mode is a structural enum — branch at codegen time so each variant emits
    // only the noise samples it needs (scalar for radial-dilate, vec2 for
    // directional). The polar-coord setup, seam hiding, and time-loop blend
    // are shared.
    //
    // n01 = unit-range noise [0, 1]. fbm(simplex) sums to roughly [-2.3, 2.3]
    // over 4 octaves; remapping to [0, 1] keeps the radial-dilate factor
    // strictly positive so UVs never invert through the center (which is what
    // produces the characteristic "ribbon" artifacts on a soft alpha mask).
    //
    // Seam hiding: atan(y, x) has a ±π branch cut on the negative-x ray, so
    // a noise field sampled at (ang, ...) discontinues there. We sample twice
    // — once raw, once with the angle wrapped by the noise period — and
    // crossfade based on p.x. The wrapped sample is used on the left half
    // where the seam lives; the raw sample is used on the right half.
    const sampleAndWarp =
      this.config.mode === "radial-dilate"
        ? `
float seamMix = smoothstep(-0.25, 0.25, p.x);
float n1raw  = fbm(polarA,        4.0, 1.99, 0.65);
float n1wrap = fbm(polarA_wrapped, 4.0, 1.99, 0.65);
float n2raw  = fbm(polarB,        4.0, 1.99, 0.65);
float n2wrap = fbm(polarB_wrapped, 4.0, 1.99, 0.65);
float n1 = clamp(mix(n1wrap, n1raw, seamMix) * 0.25 + 0.5, 0.0, 1.0);
float n2 = clamp(mix(n2wrap, n2raw, seamMix) * 0.25 + 0.5, 0.0, 1.0);
float n01 = mix(n1, n2, blend);
// Reference smoke-ring's exact mapping: factor lerps 0.8 → 2.0 across n01.
// At intensity=0 the warp disappears; at intensity=1 it matches paper-design.
float factor = mix(1.0, 0.8 + 1.2 * n01, ${intensity});
vec2 q = uv - c;
vec2 warpedUV = c + q * factor;`
        : `
float seamMix = smoothstep(-0.25, 0.25, p.x);
vec2 nv1raw  = vec2(fbm(polarA,                          4.0, 1.99, 0.65),
                    fbm(polarA + vec2(0.0, 7.3),         4.0, 1.99, 0.65));
vec2 nv1wrap = vec2(fbm(polarA_wrapped,                  4.0, 1.99, 0.65),
                    fbm(polarA_wrapped + vec2(0.0, 7.3), 4.0, 1.99, 0.65));
vec2 nv2raw  = vec2(fbm(polarB,                          4.0, 1.99, 0.65),
                    fbm(polarB + vec2(0.0, 7.3),         4.0, 1.99, 0.65));
vec2 nv2wrap = vec2(fbm(polarB_wrapped,                  4.0, 1.99, 0.65),
                    fbm(polarB_wrapped + vec2(0.0, 7.3), 4.0, 1.99, 0.65));
vec2 nv1 = mix(nv1wrap, nv1raw, seamMix) * 0.25;
vec2 nv2 = mix(nv2wrap, nv2raw, seamMix) * 0.25;
vec2 nv = mix(nv1, nv2, blend);
vec2 warpedUV = uv + nv * ${intensity} * 0.4;`;

    return {
      dependencies: [
        "fbm",
        "simplex2D",
        "pi",
        "seamlessLoopBlend",
        "applyEdgeHandling",
        "unpremultiplyAlpha",
      ],
      main: `
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 c = vec2(${cx}, ${cy});
vec2 p = (uv - c) * _ar;
float ang = atan(p.y, p.x);
float L = length(p);
// 0.5*L − inversesqrt(L) gives noise a swirling-into-center character — this
// term makes the warp feel like flow around the anchor rather than a plain
// radial blob.
float radialOff = 0.5 * L - inversesqrt(max(L, 1e-4));

// Time loop. Two sawtooth signals (tA, tB) offset by loopDuration share a
// 2*loopDuration sample-wrap period. At any wrap moment the crossfade is
// fully on the OTHER sample, hiding the discontinuity. Blend is phased on
// the unwrapped tLin so its zeros and ones land exactly on the wraps:
//   tA wraps at tLin = loopDuration, 3*loopDuration, ... → blend = 1 (show tB)
//   tB wraps at tLin = 0, 2*loopDuration, ...           → blend = 0 (show tA)
// Pattern repeats every loopDuration seconds (seamless).
float dur = max(${loopDuration}, 0.0);
float useLoop = step(1e-4, dur);
float period = 2.0 * max(dur, 1e-3);
float tLin = u_time * ${evolutionSpeed};
float tA = mix(tLin, mod(tLin + dur, period), useLoop);
float tB = mix(tLin, mod(tLin,       period), useLoop);
float blend = useLoop * seamlessLoopBlend(tLin, dur);

float scale = max(${detail}, 1e-4);
vec2 polarA = vec2(ang, tA - radialOff) * scale;
vec2 polarB = vec2(ang, tB - radialOff) * scale;
// Period-wrapped variants for the seam-hiding crossfade. The noise's natural
// period in the angle dimension is scale * TWO_PI; wrapping by that period
// pushes the discontinuity off-screen for the left-half sample.
float seamPeriod = max(abs(scale * TWO_PI), 1e-6);
vec2 polarA_wrapped = vec2(fract(polarA.x / seamPeriod) * seamPeriod, polarA.y);
vec2 polarB_wrapped = vec2(fract(polarB.x / seamPeriod) * seamPeriod, polarB.y);
${sampleAndWarp}

return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, warpedUV, ${edgeMode(this.config.edges)}));`,
    };
  }
}

register(PolarFlowField);
export default PolarFlowField;
