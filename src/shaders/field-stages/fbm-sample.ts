import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zFloat, zInt } from "@/shaders/core/schemas";

const config = z.object({
  detail: zInt(1, 6).default(5).describe("Detail"),
  roughness: zFloat(0, 1, 0.01).default(0.5).describe("Roughness"),
  lacunarity: zFloat(0.5, 4, 0.01).default(2).describe("Lacunarity"),
  distortion: zFloat(0, 4, 0.01).default(0).describe("Distortion"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Noise Texture",
  description: "Multi-octave fbm noise",
  color: "#60a5fa",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

// typeId stays `fbm-sample` so saved scenes that reference the old name
// continue to hydrate; the displayed name is "Noise Texture".
export class NoiseTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "fbm-sample";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    detail: "int",
    roughness: "float",
    lacunarity: "float",
    distortion: "float",
  };
  // Folds "distortion=0" into the rebuild key so the warp branch can be
  // pruned at codegen rather than evaluated per-pixel against a live uniform.
  variantKey(): string {
    return this.config.distortion === 0 ? "d0" : "d1";
  }

  glsl({ uniforms, config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    const warp =
      cfg.distortion === 0
        ? ""
        : `
  _np += ${uniforms.distortion} * vec2(
    simplex2D(_np + vec2(13.7, 0.0)),
    simplex2D(_np + vec2(0.0, 41.3))
  );`;
    return {
      dependencies: ["fbm", "simplex2D"],
      main: `
{
  vec2 _np = p + t;${warp}
  n = fbm(_np, float(${uniforms.detail}), ${uniforms.lacunarity}, ${uniforms.roughness});
  n = 0.5 + 0.5 * n;
}`,
    };
  }
}

register(NoiseTexture);
export default NoiseTexture;
