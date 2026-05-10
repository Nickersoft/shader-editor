import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  wobble: zFloat(0, 5, 0.01).default(1.0).describe("Wobble"),
  scanlineNoise: zFloat(0, 1, 0.01).default(0.6).describe("Scanline Noise"),
  smear: zFloat(-2, 2, 0.01).default(0.2).describe("Smear"),
  speed: zFloat(0.1, 3, 0.1).default(1.0).describe("Speed"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "VHS",
  description:
    "Analog VHS tape with intermittent tape damage, chroma bleed, and per-scanline noise",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

const SMEAR_SAMPLES = 6;
const FIELD_LINES = 487;

export class Vhs extends EffectNode<Config, Inputs> {
  static readonly typeId = "vhs";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const wobble = this.uniformName("wobble");
    const scanlineNoiseAmt = this.uniformName("scanlineNoise");
    const smear = this.uniformName("smear");
    const speed = this.uniformName("speed");

    // Unrolled chroma-smear loop. Weights are i/(N-1) * 2/N and sum to 1.
    const smearLoop: string[] = [];
    for (let i = 0; i < SMEAR_SAMPLES; i++) {
      const w = (i / (SMEAR_SAMPLES - 1)) * (2 / SMEAR_SAMPLES);
      smearLoop.push(
        `{ vec3 s = texture(u_prevPass, vec2(chromaUV.x + (${(-i).toFixed(1)}) * smearScale, chromaUV.y)).rgb;
  accumI += dot(s, vec3(0.596, -0.274, -0.322)) * ${w.toFixed(8)};
  accumQ += dot(s, vec3(0.211, -0.523,  0.312)) * ${w.toFixed(8)}; }`,
      );
    }

    return {
      functions: `
float vhs_hash2D(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float vhs_smoothNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = vhs_hash2D(i);
  float b = vhs_hash2D(i + vec2(1.0, 0.0));
  float c = vhs_hash2D(i + vec2(0.0, 1.0));
  float d = vhs_hash2D(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float vhs_scanlineHash(float row, float t, float seed) {
  return (fract(sin(row * 12.9898 + (t + seed) * 78.233) * 43758.5453) - 0.5) * 2.0;
}`,
      main: `
float t = u_time * ${speed};

// Organic on/off envelope for tape damage bursts.
float burst = smoothstep(0.45, 0.8, vhs_smoothNoise2D(vec2(t * 0.4, 0.0)));

// Per-scanline jitter (chroma + luma rows offset independently).
float rowInt = floor(uv.y * ${FIELD_LINES.toFixed(1)});
float fineGate = 0.25 + burst * 0.75;
float chromaRowOffset = vhs_scanlineHash(rowInt, t, 0.0)    * ${scanlineNoiseAmt} * 0.008 * fineGate;
float lumaRowOffset   = vhs_scanlineHash(rowInt, t, 69.42)  * ${scanlineNoiseAmt} * 0.004 * fineGate;

// Slow + fast tape waves.
float wave1 = vhs_smoothNoise2D(vec2(uv.y *  3.0, t * 0.8)) - 0.5;
float wave2 = vhs_smoothNoise2D(vec2(uv.y * 30.0, t * 6.0)) - 0.5;
float tapeWave = (wave1 * 0.008 + wave2 * 0.002) * ${wobble};

// Tape creases — narrow horizontal stripes that scroll vertically and
// gate on intermittently.
float creasePhase = smoothstep(0.92, 0.99, sin(uv.y * 8.0 - t * 3.77));
float creaseNoise = smoothstep(0.3, 1.0, vhs_smoothNoise2D(vec2(uv.y * 4.77, t)));
float creaseShift = creasePhase * creaseNoise * ${wobble} * -0.018;

// Head-switching noise concentrated in the bottom 6% of the frame.
float switchPhase = smoothstep(0.06, 0.0, uv.y);
float switchNoise = vhs_smoothNoise2D(vec2(uv.y * 60.0, t * 14.0)) - 0.5;
float switchX = switchPhase * switchNoise * ${wobble} * 0.09;
float switchY = switchPhase * ${wobble} * burst * 0.02;

float globalX = tapeWave + creaseShift + switchX;
vec2 lumaUV   = vec2(uv.x + globalX + lumaRowOffset,   uv.y + switchY);
vec2 chromaUV = vec2(uv.x + globalX + chromaRowOffset, uv.y + switchY);

// Sharp luma sample.
vec4 lumaSample = texture(u_prevPass, lumaUV);
float sharpY = dot(lumaSample.rgb, vec3(0.299, 0.587, 0.114));

// Horizontal chroma smear in YIQ. Direction follows the sign of smear.
float smearScale = ${smear} * 0.0075;
float accumI = 0.0;
float accumQ = 0.0;
${smearLoop.join("\n")}

vec3 finalRgb = vec3(
  sharpY + accumI * 0.956 + accumQ * 0.621,
  sharpY - accumI * 0.272 - accumQ * 0.647,
  sharpY - accumI * 1.106 + accumQ * 1.703
);

// Slow AC-mains beat.
float acBeat = 1.0 + cos(mod(t, 6.2831853) * 2.0 + uv.y * 0.5) * 0.015 * ${wobble};
finalRgb = clamp(finalRgb * acBeat, vec3(0.0), vec3(1.0));

return vec4(finalRgb, lumaSample.a);`,
    };
  }
}

register(Vhs);
export default Vhs;
