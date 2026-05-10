import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zColor, zFloat, zInt } from "@/shaders/core/schemas";

const config = z.object({
  colorA: zColor().default([0.77, 0.77, 0.77]).describe("Color A"),
  colorB: zColor().default([0.3, 0.3, 0.3]).describe("Color B"),
  cells: zInt(2, 80).default(10).describe("Cells"),
  gap: zFloat(0, 0.5).default(0.25).describe("Gap"),
  rotation: zAngle().default(0).describe("Rotation"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Weave",
  description: "Interlaced textile weave with two thread colors going over and under",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Weave extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "weave";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const colorA = this.uniformName("colorA");
    const colorB = this.uniformName("colorB");
    const cells = this.uniformName("cells");
    const gap = this.uniformName("gap");
    const rotation = this.uniformName("rotation");
    return {
      dependencies: ["aastep", "rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
vec2 q = p * float(${cells});
vec2 cell = floor(q);
vec2 f = fract(q) - 0.5;
bool aOver = mod(cell.x + cell.y, 2.0) < 0.5;
float threadHalf = (0.5 - clamp(${gap}, 0.0, 0.5)) * 0.5 + 0.05;
float horiz = 1.0 - aastep(threadHalf, abs(f.y));
float vert = 1.0 - aastep(threadHalf, abs(f.x));
float aMask = aOver ? horiz : horiz * 0.5;
float bMask = aOver ? vert * 0.5 : vert;
vec3 col = vec3(0.0);
float a = max(aMask, bMask);
col = mix(col, ${colorA}, aMask);
col = mix(col, ${colorB}, bMask);
return vec4(col, a);`,
    };
  }
}

register(Weave);
export default Weave;
