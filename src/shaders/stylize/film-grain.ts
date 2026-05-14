import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zBool, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  intensity: zFloat(0, 1).default(0.3).describe("Intensity"),
  size: zFloat(0, 1, 0.01).default(0.5).describe("Size"),
  bias: zFloat(-1, 1, 0.01).default(0).describe("Bias"),
  animated: zBool().default(false).describe("Animated"),
});

const meta: NodeMeta = {
  name: "Film Grain",
  description: "Per-pixel grain biased toward dark or light areas",
  color: "#a3a3a3",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class FilmGrain extends EffectNode<Config, Uniforms> {
  static readonly typeId = "film-grain";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const size = this.uniformName("size");
    const bias = this.uniformName("bias");
    const animated = this.uniformName("animated");
    return {
      dependencies: ["hash21", "luma"],
      main: `
base = texture(u_prevPass, uv);
float seed = ${animated} ? floor(u_time * 30.0) : 0.0;
float pxScale = mix(8.0, 0.5, clamp(${size}, 0.0, 1.0));
vec2 grainUV = floor(uv * u_resolution / max(pxScale, 0.001));
float n = hash21(grainUV + vec2(seed * 13.7, seed * 7.13));
float grain = (n - 0.5) * 2.0 * ${intensity};
float lum = luma(base.rgb);
float w = smoothstep(0.0, 0.5 + ${bias}, lum);
vec3 rgb = mix(base.rgb, base.rgb + grain, w);
return vec4(rgb, base.a);`,
    };
  }
}

register(FilmGrain);
export default FilmGrain;
