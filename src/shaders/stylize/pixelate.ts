import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  cells: zFloat(4, 400, 1).default(80.0).describe("Cells"),
  gap: zFloat(0, 1).default(0).describe("Gap"),
  roundness: zFloat(0, 1).default(0).describe("Roundness"),
});

const meta: NodeMeta = {
  name: "Pixelate",
  description: "Reduce resolution to discrete cells with optional gap and rounded corners",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Pixelate extends EffectNode<Config, Uniforms> {
  static readonly typeId = "pixelate";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const cells = this.uniformName("cells");
    const gap = this.uniformName("gap");
    const roundness = this.uniformName("roundness");
    return {
      main: `
vec2 cellsV = vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)));
vec2 q = (floor(uv * cellsV) + 0.5) / cellsV;
vec4 src = texture(u_prevPass, q);

vec2 cellUv = fract(uv * cellsV) - 0.5;
vec2 ap = abs(cellUv);
float halfSize = 0.5 - clamp(${gap}, 0.0, 0.49);
float r = clamp(${roundness}, 0.0, 1.0) * halfSize;
vec2 d = ap - vec2(halfSize - r);
float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
float fw = fwidth(sd);
float mask = 1.0 - smoothstep(-fw, fw, sd);

return vec4(src.rgb, src.a * mask);`,
    };
  }
}

register(Pixelate);
export default Pixelate;
