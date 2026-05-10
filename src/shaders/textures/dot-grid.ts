import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  color: zColor().default([1, 1, 1]).describe("Color"),
  density: zFloat(2, 200, 1).default(30).describe("Density"),
  dotSize: zFloat(0, 1).default(0.3).describe("Dot Size"),
  twinkle: zFloat(0, 1).default(0).describe("Twinkle"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Dot Grid",
  description: "Grid of dots with optional twinkling animation",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class DotGrid extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "dot-grid";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const color = this.uniformName("color");
    const density = this.uniformName("density");
    const dotSize = this.uniformName("dotSize");
    const twinkle = this.uniformName("twinkle");
    return {
      dependencies: ["hash21"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 q = uv * _ar * ${density};
vec2 cellId = floor(q);
vec2 cellUv = fract(q) - 0.5;
float d = length(cellUv);
float sz = clamp(${dotSize}, 0.0, 1.0) * 0.5;
float aa = fwidth(d);
float dot_ = 1.0 - smoothstep(sz - aa, sz + aa, d);
float tw = 0.5 + 0.5 * sin(u_time * 3.0 + hash21(cellId) * 6.2831);
float a = dot_ * mix(1.0, tw, ${twinkle});
return vec4(${color} * a, a);`,
    };
  }
}

register(DotGrid);
export default DotGrid;
