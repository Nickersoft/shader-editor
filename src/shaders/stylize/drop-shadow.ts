import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zBool, zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  angle: zAngle().default(135).describe("Angle"),
  distance: zFloat(0, 1, 0.001).default(0.05).describe("Distance"),
  blur: zFloat(0, 50, 0.5).default(10).describe("Blur"),
  color: zColor().default([0, 0, 0]).describe("Shadow Color"),
  opacity: zFloat(0, 1).default(0.5).describe("Opacity"),
  cutout: zBool().default(false).describe("Cutout"),
});

const meta: NodeMeta = {
  name: "Drop Shadow",
  description: "Soft shadow behind opaque content",
  color: "#1e293b",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class DropShadow extends EffectNode<Config, Uniforms> {
  static readonly typeId = "drop-shadow";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const angle = this.uniformName("angle");
    const distance = this.uniformName("distance");
    const blur = this.uniformName("blur");
    const color = this.uniformName("color");
    const opacity = this.uniformName("opacity");
    const cutout = this.uniformName("cutout");
    return {
      dependencies: ["gaussian13", "pi"],
      main: `
vec2 texel = 1.0 / u_resolution;
float a = ${angle} * PI / 180.0;
vec2 off = vec2(cos(a), sin(a)) * ${distance};
vec2 blurDir = texel * ${blur};
vec4 h = gaussian13(u_prevPass, uv - off, vec2(blurDir.x, 0.0));
vec4 v = gaussian13(u_prevPass, uv - off, vec2(0.0, blurDir.y));
float shadowA = (h.a + v.a) * 0.5 * ${opacity};
vec4 src = texture(u_prevPass, uv);
vec4 shadow = vec4(${color}, shadowA);
if (${cutout}) {
  float a2 = shadow.a * (1.0 - src.a);
  return vec4(shadow.rgb, a2);
}
vec4 outCol;
outCol.rgb = mix(shadow.rgb, src.rgb, src.a);
outCol.a = src.a + shadow.a * (1.0 - src.a);
return outCol;`,
    };
  }
}

register(DropShadow);
export default DropShadow;
