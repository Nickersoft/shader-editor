import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { transformFields, zColor, zFloat } from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";

const config = z.object({
  ...transformFields(),
  innerRatio: zFloat(0.3, 1.2, 0.01).default(0.8).describe("Inner Ratio"),
  offset: zFloat(0.01, 1, 0.001).default(0.4).describe("Offset"),
  fillColor: zColor().default([1, 1, 1]).describe("Fill"),
  strokeColor: zColor().default([0, 0, 0]).describe("Stroke"),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe("Stroke Width"),
  strokeMode: z.enum(["inside", "center", "outside"]).default("center").describe("Stroke Mode"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Crescent",
  description: "Crescent moon shape (subtracts an offset circle)",
  color: "#3b82f6",
  category: "shapes",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Crescent extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "crescent";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly spatialControls: readonly SpatialControl[] = [
    {
      kind: "transform",
      x: "x",
      y: "y",
      w: "width",
      h: "height",
      rotation: "rotation",
      label: "Bounds",
    },
  ];

  glsl(): GlslBlock {
    const x = this.uniformName("x");
    const y = this.uniformName("y");
    const w = this.uniformName("width");
    const h = this.uniformName("height");
    const rot = this.uniformName("rotation");
    const ir = this.uniformName("innerRatio");
    const off = this.uniformName("offset");
    const fill = this.uniformName("fillColor");
    const stroke = this.uniformName("strokeColor");
    const sw = this.uniformName("strokeWidth");
    const offsetExpr =
      this.config.strokeMode === "inside"
        ? `(-${sw} * 0.5)`
        : this.config.strokeMode === "outside"
          ? `(${sw} * 0.5)`
          : `0.0`;
    return {
      dependencies: ["aastep", "sdCircle", "rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d1 = sdCircle(pn, 1.0);
float d2 = sdCircle(pn - vec2(${off}, 0.0), ${ir});
float d = max(d1, -d2) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offsetExpr}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    };
  }
}

register(Crescent);
export default Crescent;
