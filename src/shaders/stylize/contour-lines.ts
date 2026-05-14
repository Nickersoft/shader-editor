import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  colorBack: zColor().default([0.02, 0.04, 0.05]).describe("Background"),
  colorFront: zColor().default([0.55, 0.95, 0.7]).describe("Lines"),
  scale: zFloat(0.5, 20, 0.1).default(3.0).describe("Scale"),
  frequency: zFloat(1, 30, 0.5).default(5.0).describe("Line Frequency"),
  thickness: zFloat(0, 1).default(0.5).describe("Thickness"),
  softness: zFloat(0, 1).default(0.3).describe("Softness"),
  speed: zFloat(0, 4, 0.05).default(0.0).describe("Speed"),
});

const meta: NodeMeta = {
  name: "Contour Lines",
  description: "Topographic contour lines from noise",
  color: "#84cc16",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class ContourLines extends EffectNode<Config, Uniforms> {
  static readonly typeId = "contour-lines";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const colorBack = this.uniformName("colorBack");
    const colorFront = this.uniformName("colorFront");
    const scale = this.uniformName("scale");
    const frequency = this.uniformName("frequency");
    const thickness = this.uniformName("thickness");
    const softness = this.uniformName("softness");
    const speed = this.uniformName("speed");
    return {
      dependencies: ["simplex2D"],
      main: `
base = texture(u_prevPass, uv);
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale} + u_time * ${speed} * 0.3;
float n = simplex2D(q) * 0.5 + 0.5;
float lines = abs(fract(n * ${frequency}) - 0.5) * 2.0;
float halfWidth = clamp(${thickness}, 0.0, 1.0) * 0.5;
float soft = max(${softness}, 0.001) * 0.5;
float m = 1.0 - smoothstep(halfWidth, halfWidth + soft, lines);
return vec4(mix(${colorBack}, ${colorFront}, m), 1.0);`,
    };
  }
}

register(ContourLines);
export default ContourLines;
