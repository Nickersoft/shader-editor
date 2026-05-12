import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  scale: zFloat(0.1, 200, 0.1).default(30).describe("Scale"),
  radius: zFloat(0, 1, 0.005).default(0.15).describe("Radius"),
  softness: zFloat(0, 1, 0.005).default(0.05).describe("Softness"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Dot Grid",
  description: "Circular dot per cell — n=1 inside dots, n=0 outside",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class DotGridStage extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "dot-grid";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    radius: "float",
    softness: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
{
  vec2 _dp = p * ${uniforms.scale};
  vec2 _dc = fract(_dp) - 0.5;
  float _dd = length(_dc);
  float _dr = clamp(${uniforms.radius}, 0.0, 1.0) * 0.5;
  float _ds = clamp(${uniforms.softness}, 0.0, 1.0) * 0.5 + fwidth(_dd);
  n = 1.0 - smoothstep(_dr, _dr + _ds, _dd);
}`,
    };
  }
}

register(DotGridStage);
export default DotGridStage;
