import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zEdges, zFloat, zVec2 } from "@/shaders/core/schemas";

const config = z.object({
  edges: zEdges().default("transparent").describe("Edges"),
});

const uniforms = z.object({
  pan: zVec2(-1, 1, 0.01).default([0, 0]).describe("Pan"),
  tilt: zVec2(-1, 1, 0.01).default([0, 0]).describe("Tilt"),
  fov: zFloat(10, 120, 1).default(60.0).describe("FOV"),
  offset: zVec2(-1, 1, 0.01).default([0, 0]).describe("Offset"),
});

const meta: NodeMeta = {
  name: "Perspective",
  description: "Rotate the plane in 3D space with pan, tilt, and FOV",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Perspective extends EffectNode<Config, Uniforms> {
  static readonly typeId = "perspective";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const pan = this.uniformName("pan");
    const tilt = this.uniformName("tilt");
    const fov = this.uniformName("fov");
    const offset = this.uniformName("offset");
    return {
      dependencies: ["pi", "applyEdgeHandling", "unpremultiplyAlpha"],
      main: `
vec3 p = vec3((uv - 0.5 - ${offset}) * 2.0, 1.0);
float fovScale = 1.0 / tan(${fov} * 0.5 * PI / 180.0);
p.xy *= fovScale;
float ay = ${tilt}.x;
float ax = ${tilt}.y;
float cy = cos(ay), sy = sin(ay);
float cx = cos(ax), sx = sin(ax);
mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
p = rx * (ry * p);
vec2 finalUV = p.xy / max(p.z, 0.001) * 0.5 + 0.5 + ${pan};
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    };
  }
}

register(Perspective);
export default Perspective;
