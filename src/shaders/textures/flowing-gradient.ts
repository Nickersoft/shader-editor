import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  colorA: zColor().default([0.04, 0.0, 0.08]).describe("Color A"),
  colorB: zColor().default([0.42, 0.09, 0.9]).describe("Color B"),
  colorC: zColor().default([1.0, 0.3, 0.42]).describe("Color C"),
  colorD: zColor().default([1.0, 0.42, 0.21]).describe("Color D"),
  speed: zFloat(0, 4, 0.05).default(1).describe("Speed"),
  distortion: zFloat(0, 1).default(0.5).describe("Distortion"),
  seed: zFloat(0, 100, 0.1).default(0).describe("Seed"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Flowing Gradient",
  description: "Liquid silk gradient with organic flowing color bands",
  color: "#6b17e6",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class FlowingGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "flowing-gradient";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const colorA = this.uniformName("colorA");
    const colorB = this.uniformName("colorB");
    const colorC = this.uniformName("colorC");
    const colorD = this.uniformName("colorD");
    const speed = this.uniformName("speed");
    const distortion = this.uniformName("distortion");
    const seed = this.uniformName("seed");
    return {
      dependencies: ["fbm", "simplex2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float t = u_time * ${speed} * 0.15 + ${seed};

float warp = ${distortion} * 1.6;
vec2 q = p + warp * vec2(
  fbm(p * 0.8 + vec2(0.0, t), 2.0, 2.0, 0.5),
  fbm(p * 0.8 + vec2(t, 0.0), 2.0, 2.0, 0.5)
);
vec2 r = p + warp * vec2(
  fbm(q * 1.0 + vec2(t * 1.3, 0.0), 2.0, 2.0, 0.5),
  fbm(q * 1.0 + vec2(0.0, t * 1.1), 2.0, 2.0, 0.5)
);

float band = fbm(r * 0.9 + t, 2.0, 2.0, 0.5);
float k = clamp(0.5 + 0.5 * band, 0.0, 1.0);

// Stepped 4-color ramp.
vec3 col;
if (k < 0.333) {
  col = mix(${colorA}, ${colorB}, k * 3.0);
} else if (k < 0.666) {
  col = mix(${colorB}, ${colorC}, (k - 0.333) * 3.0);
} else {
  col = mix(${colorC}, ${colorD}, (k - 0.666) * 3.0);
}
return vec4(col, 1.0);`,
    };
  }
}

register(FlowingGradient);
export default FlowingGradient;
