import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  threshold: zFloat(0, 1).default(0.5).describe("Threshold"),
  radius: zFloat(0, 40, 0.5).default(8).describe("Radius"),
  intensity: zFloat(0, 4, 0.05).default(1).describe("Intensity"),
  tint: zColor().default([1, 1, 1]).describe("Tint"),
});

const meta: NodeMeta = {
  name: "Glow",
  description: "True bloom — bright pass + blur + add",
  color: "#fbbf24",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Glow extends EffectNode<Config, Uniforms> {
  static readonly typeId = "glow";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const threshold = this.uniformName("threshold");
    const radius = this.uniformName("radius");
    const intensity = this.uniformName("intensity");
    const tint = this.uniformName("tint");
    return {
      dependencies: ["luma"],
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 r = texel * ${radius};
vec3 bright = vec3(0.0);
const int N = 3;
for (int i = -N; i <= N; i++) {
  for (int j = -N; j <= N; j++) {
    vec3 c = texture(u_prevPass, uv + r * vec2(float(i), float(j))).rgb;
    bright += max(c - ${threshold}, vec3(0.0)) * smoothstep(${threshold} - 0.05, ${threshold} + 0.05, luma(c));
  }
}
bright /= float((2 * N + 1) * (2 * N + 1));
vec4 src = texture(u_prevPass, uv);
return vec4(src.rgb + bright * ${tint} * ${intensity}, src.a);`,
    };
  }
}

register(Glow);
export default Glow;
