import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  pixelSize: zFloat(0, 0.05, 0.001).default(0.005).describe("Pixel Size"),
  scanlineFrequency: zFloat(50, 500, 1).default(200).describe("Scanline Frequency"),
  brightness: zFloat(0, 2, 0.01).default(1.1).describe("Brightness"),
  contrast: zFloat(0, 2, 0.01).default(1.1).describe("Contrast"),
  vignetteRadius: zFloat(0, 2, 0.01).default(0.8).describe("Vignette Radius"),
  vignetteIntensity: zFloat(0, 1).default(0.5).describe("Vignette Intensity"),
});

const meta: NodeMeta = {
  name: "CRT Screen",
  description: "Pixelation, scanlines, brightness/contrast, and vignette",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class CrtScreen extends EffectNode<Config, Uniforms> {
  static readonly typeId = "crt-screen";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const pixelSize = this.uniformName("pixelSize");
    const scanlineFrequency = this.uniformName("scanlineFrequency");
    const brightness = this.uniformName("brightness");
    const contrast = this.uniformName("contrast");
    const vignetteRadius = this.uniformName("vignetteRadius");
    const vignetteIntensity = this.uniformName("vignetteIntensity");
    return {
      dependencies: ["pi"],
      main: `
float ps = max(${pixelSize}, 1e-5);
vec2 q = (floor(uv / ps) + 0.5) * ps;
vec4 src = texture(u_prevPass, q);
vec3 col = src.rgb;
float scan = 0.5 + 0.5 * sin(uv.y * ${scanlineFrequency} * PI * 2.0);
col *= mix(1.0, scan, 0.5);
col = (col - 0.5) * ${contrast} + 0.5;
col *= ${brightness};
vec2 d = uv - 0.5;
float r = length(d);
float vig = smoothstep(${vignetteRadius}, ${vignetteRadius} - 0.5, r);
col = mix(col, col * vig, ${vignetteIntensity});
return vec4(col, src.a);`,
    };
  }
}

register(CrtScreen);
export default CrtScreen;
