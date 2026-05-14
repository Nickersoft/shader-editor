import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  style: z.enum(["classic", "cmyk"]).default("classic").describe("Style"),
});

const uniforms = z.object({
  cells: zFloat(4, 400, 1).default(60).describe("Cells"),
  angle: zFloat(0, 90, 1).default(30).describe("Angle"),
  softness: zFloat(0.001, 0.4, 0.001).default(0.05).describe("Softness"),
  colorBack: zColor().default([1, 1, 1]).describe("Background"),
  colorDot: zColor().default([0, 0, 0]).describe("Dot"),
});

const meta: NodeMeta = {
  name: "Halftone",
  description: "Print-style dot screen — classic monochrome or CMYK plates",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Halftone extends EffectNode<Config, Uniforms> {
  static readonly typeId = "halftone";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const cells = this.uniformName("cells");
    const angle = this.uniformName("angle");
    const softness = this.uniformName("softness");
    const colorBack = this.uniformName("colorBack");
    const colorDot = this.uniformName("colorDot");

    if (this.config.style === "cmyk") {
      const prefix = this.prefix;
      const fnName = `halftone_${prefix}_plate`;
      return {
        dependencies: ["rotate2D"],
        functions: `
float ${fnName}(vec2 uv, vec2 ar, float v, float deg, float soft) {
  vec2 q = rotate2D(uv - 0.5, deg * 3.14159265 / 180.0) + 0.5;
  vec2 cu = fract(q * ar) - 0.5;
  float r = clamp(v, 0.0, 1.0) * 0.5;
  float d = length(cu);
  return 1.0 - smoothstep(r - soft, r + soft, d);
}`,
        main: `
vec4 src = texture(u_prevPass, uv);
vec3 rgb = clamp(src.rgb, 0.0, 1.0);
float K = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
float denom = max(1.0 - K, 1e-4);
float C = (1.0 - rgb.r - K) / denom;
float M = (1.0 - rgb.g - K) / denom;
float Y = (1.0 - rgb.b - K) / denom;
vec2 ar = vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)));
float dC = ${fnName}(uv, ar, C, 75.0, ${softness});
float dM = ${fnName}(uv, ar, M, 15.0, ${softness});
float dY = ${fnName}(uv, ar, Y, 0.0, ${softness});
float dK = ${fnName}(uv, ar, K, 45.0, ${softness});
vec3 plateC = vec3(0.0, 0.7, 1.0);
vec3 plateM = vec3(1.0, 0.0, 0.6);
vec3 plateY = vec3(1.0, 0.95, 0.0);
vec3 plateK = vec3(0.0);
vec3 col = vec3(1.0);
col = mix(col, plateC, dC);
col = mix(col, plateM, dM);
col = mix(col, plateY, dY);
col = mix(col, plateK, dK);
return vec4(col, src.a);`,
      };
    }

    return {
      dependencies: ["rotate2D", "luma"],
      main: `
vec2 q = rotate2D(uv - 0.5, ${angle} * 3.14159 / 180.0) + 0.5;
vec2 cellUv = fract(q * vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)))) - 0.5;
float lum = luma(texture(u_prevPass, uv).rgb);
float radius = (1.0 - lum) * 0.5;
float d = length(cellUv);
float fillDot = 1.0 - smoothstep(radius - ${softness}, radius + ${softness}, d);
return vec4(mix(${colorBack}, ${colorDot}, fillDot), 1.0);`,
    };
  }
}

register(Halftone);
export default Halftone;
