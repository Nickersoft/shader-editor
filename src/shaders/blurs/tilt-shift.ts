import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zCenterAxis, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.5).describe("Intensity"),
  width: zFloat(0, 1, 0.01).default(0.3).describe("Width"),
  falloff: zFloat(0, 1, 0.01).default(0.3).describe("Falloff"),
  angle: zAngle().default(0).describe("Angle"),
  centerX: zCenterAxis().default(0.5).describe("Center X"),
  centerY: zCenterAxis().default(0.5).describe("Center Y"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Tilt Shift",
  description: "Selective focus band (tilt-shift miniature)",
  color: "#0ea5e9",
  category: "blurs",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class TiltShift extends EffectNode<Config, Inputs> {
  static readonly typeId = "tilt-shift";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const width = this.uniformName("width");
    const falloff = this.uniformName("falloff");
    const angle = this.uniformName("angle");
    const cx = this.uniformName("centerX");
    const cy = this.uniformName("centerY");
    return {
      dependencies: ["gaussian13"],
      main: `
vec2 texel = 1.0 / u_resolution;
float aspect = u_resolution.x / u_resolution.y;
float a = ${angle} * 3.14159265 / 180.0;
vec2 perp = vec2(-sin(a), cos(a));
vec2 d = uv - vec2(${cx}, ${cy});
float dist = abs(dot(vec2(d.x * aspect, d.y), perp));
float fw = ${width} * 0.5;
float t = smoothstep(fw, fw + ${falloff}, dist);
float r = t * ${intensity} * 100.0 * 0.36;
vec4 h = gaussian13(u_prevPass, uv, vec2(texel.x * r, 0.0));
vec4 v = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * r));
return (h + v) * 0.5;`,
    };
  }
}

register(TiltShift);
export default TiltShift;
