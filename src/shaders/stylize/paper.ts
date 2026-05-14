import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  displacement: zFloat(0, 1).default(0.5).describe("Displacement"),
  frequency: zFloat(1, 50, 0.5).default(10).describe("Frequency"),
  roughness: zFloat(0, 1).default(0.5).describe("Roughness"),
  seed: zFloat(0, 10, 0.01).default(0).describe("Seed"),
});

const meta: NodeMeta = {
  name: "Paper",
  description: "Multi-octave paper-fiber overlay",
  color: "#fef3c7",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Paper extends EffectNode<Config, Uniforms> {
  static readonly typeId = "paper";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const displacement = this.uniformName("displacement");
    const frequency = this.uniformName("frequency");
    const roughness = this.uniformName("roughness");
    const seed = this.uniformName("seed");
    return {
      dependencies: ["simplex2D"],
      main: `
base = texture(u_prevPass, uv);
vec2 q = uv * ${frequency} + vec2(${seed}, ${seed} * 1.7);
float n =
  simplex2D(q) * 0.5 +
  simplex2D(q * 2.0) * 0.25 +
  simplex2D(q * 4.0) * 0.125 +
  simplex2D(q * 8.0) * 0.0625;
n = n * 0.5 + 0.5;
vec3 disp = base.rgb + (n - 0.5) * ${displacement};
vec3 rgb = mix(base.rgb, disp, ${roughness});
return vec4(rgb, base.a);`,
    };
  }
}

register(Paper);
export default Paper;
