import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  strength: zFloat(0, 1).default(0.5).describe("Strength"),
  angle: zAngle().default(0).describe("Angle"),
});

const meta: NodeMeta = {
  name: "Chromatic Aberration",
  description: "Aspect-corrected RGB channel offset along an angle",
  color: "#ef4444",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class ChromaticAberration extends EffectNode<Config, Uniforms> {
  static readonly typeId = "chromatic-aberration";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const strength = this.uniformName("strength");
    const angle = this.uniformName("angle");
    return {
      dependencies: ["pi"],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
float a = ${angle} * PI / 180.0;
vec2 dir = vec2(cos(a) / aspect, sin(a));
vec2 off = dir * ${strength} * 0.01;
float r = texture(u_prevPass, uv - off).r;
vec4 g = texture(u_prevPass, uv);
float b = texture(u_prevPass, uv + off).b;
return vec4(r, g.g, b, g.a);`,
    };
  }
}

register(ChromaticAberration);
export default ChromaticAberration;
