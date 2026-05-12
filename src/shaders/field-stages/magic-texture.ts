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
  depth: zInt(0, 10).default(2).describe("Depth"),
  scale: zFloat(0.1, 16, 0.1).default(5).describe("Scale"),
  distortion: zFloat(0, 4, 0.01).default(1).describe("Distortion"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Magic Texture",
  description: "Recursive sin/cos pattern",
  color: "#a78bfa",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

// `depth` is a config-time switch (not a uniform) — the recursion is unrolled
// at codegen so the loop bound becomes a constant the GLSL compiler can fold.
export class MagicTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "magic-texture";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    distortion: "float",
  };

  glsl({ uniforms, config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    const depth = Math.max(0, Math.min(10, Math.floor(cfg.depth)));
    const iterations: string[] = [];
    for (let i = 0; i < depth; i++) {
      iterations.push(`
  _mx = sin(_mx * _my + _mt);
  _my = cos(_mx + _my + _mt);
  _mx *= _dist;
  _my *= _dist;`);
    }
    return {
      main: `
{
  vec2 _mp = p * ${uniforms.scale};
  float _mt = t * 0.5;
  float _dist = ${uniforms.distortion};
  float _mx = sin((_mp.x + _mp.y) * 5.0 + _mt);
  float _my = cos((_mp.x - _mp.y) * 5.0 - _mt);
  ${iterations.join("\n")}
  n = clamp(0.5 + 0.5 * (sin(_mx + _my) + cos(_mx - _my)) * 0.5, 0.0, 1.0);
}`,
    };
  }
}

register(MagicTexture);
export default MagicTexture;
