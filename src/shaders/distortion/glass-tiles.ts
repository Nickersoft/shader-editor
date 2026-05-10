import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zAngle, zEdges, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.5).describe("Intensity"),
  tileCount: zFloat(1, 50, 1).default(8.0).describe("Tile Count"),
  rotation: zAngle().default(0.0).describe("Rotation"),
  roundness: zFloat(0, 1, 0.01).default(0.5).describe("Roundness"),
  edges: zEdges().default("stretch").describe("Edges"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Glass Tiles",
  description: "Refraction-like distortion in a tile grid pattern",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class GlassTiles extends EffectNode<Config, Inputs> {
  static readonly typeId = "glass-tiles";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const tileCount = this.uniformName("tileCount");
    const rotation = this.uniformName("rotation");
    const roundness = this.uniformName("roundness");
    return {
      dependencies: ["pi", "applyEdgeHandling", "unpremultiplyAlpha"],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 tileC = aspect > 1.0
  ? vec2(${tileCount}, ${tileCount} / aspect)
  : vec2(${tileCount} * aspect, ${tileCount});
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
float rotR = ${rotation} * PI / 180.0;
float ca = cos(rotR);
float sa = sin(rotR);
vec2 centered = aspectUV - vec2(0.5 * aspect, 0.5);
vec2 rotated = vec2(centered.x * ca - centered.y * sa, centered.x * sa + centered.y * ca) + vec2(0.5 * aspect, 0.5);
vec2 gridUV = vec2(rotated.x / aspect, rotated.y);
vec2 tileSize = vec2(1.0) / tileC;
vec2 tileOrigin = floor(gridUV * tileC) / tileC;
vec2 fromCenter = (gridUV - tileOrigin) / tileSize - vec2(0.5);
float roundMask = max(0.0, 1.0 - dot(fromCenter, fromCenter) * ${roundness} * 4.0);
vec2 baseDist = fromCenter * ${intensity} * 0.025 * roundMask;
vec2 finalUV = uv + vec2(baseDist.x / aspect, baseDist.y);
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    };
  }
}

register(GlassTiles);
export default GlassTiles;
