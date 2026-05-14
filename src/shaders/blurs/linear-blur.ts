import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.3).describe("Intensity"),
  angle: zAngle().default(0).describe("Angle"),
});

const meta: NodeMeta = {
  name: "Linear Blur",
  description: "Directional motion blur",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

const WEIGHTS = `const float W[32] = float[32](
  0.018339, 0.020218, 0.022146, 0.024100, 0.026056, 0.027988, 0.029869, 0.031669,
  0.033361, 0.034915, 0.036304, 0.037504, 0.038492, 0.039251, 0.039765, 0.040024,
  0.040024, 0.039765, 0.039251, 0.038492, 0.037504, 0.036304, 0.034915, 0.033361,
  0.031669, 0.029869, 0.027988, 0.026056, 0.024100, 0.022146, 0.020218, 0.018339
);`;

export class LinearBlur extends EffectNode<Config, Uniforms> {
  static readonly typeId = "linear-blur";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const angle = this.uniformName("angle");
    return {
      main: `
${WEIGHTS}
vec2 texel = 1.0 / u_resolution;
float aspect = u_resolution.x / u_resolution.y;
float a = ${angle} * 3.14159265 / 180.0;
vec2 dir = vec2(cos(a) / aspect, sin(a)) * ${intensity} * 100.0;
vec2 step = dir * texel;
vec4 acc = vec4(0.0);
for (int i = 0; i < 32; i++) {
  float t = float(i) / 31.0 - 0.5;
  acc += texture(u_prevPass, uv + step * t * 2.0) * W[i];
}
return acc;`,
    };
  }
}

register(LinearBlur);
export default LinearBlur;
