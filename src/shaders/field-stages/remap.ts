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
  balance: zFloat(-1, 1).default(0),
  contrast: zFloat(-1, 4, 0.05).default(0),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Levels",
  description:
    "Shapes the scalar field via balance and contrast — operates on the signal before colorization (distinct from the post-color Brightness/Contrast effect)",
  color: "#fbbf24",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Remap extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "remap";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    balance: "float",
    contrast: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
n = clamp(n + ${uniforms.balance} * 0.5, 0.0, 1.0);
{
  float _c = clamp(${uniforms.contrast} + 1.0, 0.0, 5.0);
  n = clamp((n - 0.5) * _c + 0.5, 0.0, 1.0);
}`,
    };
  }
}

register(Remap);
export default Remap;
