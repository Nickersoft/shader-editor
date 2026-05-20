import { z } from "zod";
import { StaticShader } from "@/shaders/core/shader.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, ShaderMeta } from "@/shaders/core/types";
import { transformFields, zColor, zFloat } from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";

const schema = z.object({
  strokeMode: z.enum(["inside", "center", "outside"]).default("center").describe("Stroke Mode"),
  ...transformFields(),
  spread: zFloat(0.05, 0.95, 0.01).default(0.5).describe("Spread"),
  fillColor: zColor().default([1, 1, 1]).describe("Fill"),
  strokeColor: zColor().default([0, 0, 0]).describe("Stroke"),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe("Stroke Width"),
});

const meta: ShaderMeta = {
  name: "Vesica",
  description: "Almond / lens shape (intersection of two circles)",
  color: "#3b82f6",
  category: "shapes",
  defaultBlendMode: "normal",
};

type Inputs = z.infer<typeof schema>;

export class Vesica extends StaticShader<Inputs> {
  static readonly typeId = "vesica";
  static readonly schema = schema;
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
    const spread = this.uniformName("spread");
    const fill = this.uniformName("fillColor");
    const stroke = this.uniformName("strokeColor");
    const sw = this.uniformName("strokeWidth");
    const offset =
      this.inputs.strokeMode === "inside"
        ? `(-${sw} * 0.5)`
        : this.inputs.strokeMode === "outside"
          ? `(${sw} * 0.5)`
          : `0.0`;
    return {
      dependencies: ["aastep", "sdVesica", "rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d = sdVesica(pn.yx, 1.0, ${spread}) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    };
  }
}

register(Vesica);
export default Vesica;
