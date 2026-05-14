import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  intensity: zFloat(0, 1).default(0.5).describe("Intensity"),
  speed: zFloat(0, 2, 0.05).default(0.3).describe("Speed"),
  scale: zFloat(0.1, 5, 0.05).default(2.0).describe("Scale"),
  color1: zColor().default([0.55, 0.95, 1.0]).describe("Color 1"),
  color2: zColor().default([0.02, 0.63, 0.84]).describe("Color 2"),
});

const meta: NodeMeta = {
  name: "Smoke Fill",
  description: "Fill an alpha mask with billowing smoke",
  color: "#94a3b8",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class SmokeFill extends EffectNode<Config, Uniforms> {
  static readonly typeId = "smoke-fill";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const speed = this.uniformName("speed");
    const scale = this.uniformName("scale");
    const c1 = this.uniformName("color1");
    const c2 = this.uniformName("color2");
    return {
      dependencies: ["fbm", "simplex2D", "unpremultiplyAlpha"],
      main: `
// Sample the previous pass directly — when SmokeFill runs as its own FBO pass
// the codegen passes \`base\` as vec4(0), so we cannot rely on it. The previous
// alpha mask (e.g. a shape) gates where the smoke actually paints.
vec4 prev = unpremultiplyAlpha(texture(u_prevPass, uv));
float n = fbm(uv * ${scale} + u_time * vec2(0.0, ${speed} * 0.1), 4.0, 2.0, 0.5) * 0.5 + 0.5;
vec3 smoke = mix(${c1}, ${c2}, n);
return vec4(mix(prev.rgb, smoke, prev.a * ${intensity} * n), prev.a);`,
    };
  }
}

register(SmokeFill);
export default SmokeFill;
