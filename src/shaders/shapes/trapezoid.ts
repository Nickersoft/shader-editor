import { z } from "zod";
import { StaticShader } from "@/shaders/core/shader.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { transformFields, zColor, zFloat } from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";

const schema = z.object({
  strokeMode: z.enum(["inside", "center", "outside"]).default("center").describe("Stroke Mode"),
  ...transformFields(),
  topRatio: zFloat(0, 1, 0.001).default(0.6).describe("Top Ratio"),
  fillColor: zColor().default([1, 1, 1]).describe("Fill"),
  strokeColor: zColor().default([0, 0, 0]).describe("Stroke"),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe("Stroke Width"),
});

const meta: NodeMeta = {
  name: "Trapezoid",
  description: "Trapezoid filling its bounding box; top width is a ratio of the bottom",
  color: "#f59e0b",
  category: "shapes",
  defaultBlendMode: "normal",
};

type Inputs = z.infer<typeof schema>;

export class Trapezoid extends StaticShader<Inputs> {
  static readonly typeId = "trapezoid";
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
    const tr = this.uniformName("topRatio");
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
      dependencies: ["aastep", "rotate2D"],
      functions: `
float sdTrapezoid(vec2 p, float topWidth, float bottomWidth, float height) {
  vec2 k1 = vec2(bottomWidth, height);
  vec2 k2 = vec2(bottomWidth - topWidth, 2.0 * height);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x - min(p.x, p.y < 0.0 ? bottomWidth : topWidth), abs(p.y) - height);
  vec2 cb = p - k1 + k2 * clamp(dot(k1 - p, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
// Bottom width = bbox width; top width = ratio × bottom. Height = bbox height.
float halfBottom = ${w} * 0.5;
float halfTop = halfBottom * ${tr};
float halfHeight = ${h} * 0.5;
float d = sdTrapezoid(p, halfTop, halfBottom, halfHeight);
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    };
  }
}

register(Trapezoid);
export default Trapezoid;
