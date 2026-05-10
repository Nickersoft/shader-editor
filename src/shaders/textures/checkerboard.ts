import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  scale: zFloat(1, 64, 0.5).default(8.0).describe("Scale"),
  rotation: zAngle().default(0).describe("Rotation"),
  softness: zFloat(0, 1).default(0).describe("Softness"),
  color1: zColor().default([0.05, 0.05, 0.05]).describe("Color 1"),
  color2: zColor().default([0.95, 0.95, 0.95]).describe("Color 2"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Checkerboard",
  description: "Two-tone tiled checker pattern (softness=1 for sinusoidal blend)",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Checkerboard extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "checkerboard";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const scale = this.uniformName("scale");
    const rotation = this.uniformName("rotation");
    const softness = this.uniformName("softness");
    const color1 = this.uniformName("color1");
    const color2 = this.uniformName("color2");
    return {
      dependencies: ["aastep", "rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
vec2 cell = floor(p * ${scale});
float hard = mod(cell.x + cell.y, 2.0);
float soft = 0.5 + 0.5 * sin(p.x * 3.14159 * ${scale}) * cos(p.y * 3.14159 * ${scale});
float m = mix(hard, soft, ${softness});
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    };
  }
}

register(Checkerboard);
export default Checkerboard;
