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
  intensity: zFloat(0, 4, 0.01).default(1.5),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Sine Field",
  description: "Sum-of-sines pattern — classic plasma signal",
  color: "#ec4899",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class PlasmaSample extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "plasma-sample";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = { intensity: "float" };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
{
  float _v = sin(p.x + t)
           + sin(p.y * 0.7 + t * 1.3)
           + sin((p.x + p.y) * 0.6 + t * 0.9)
           + sin(length(p) - t);
  _v *= 0.25 * ${uniforms.intensity};
  n = clamp(0.5 + 0.5 * _v, 0.0, 1.0);
}`,
    };
  }
}

register(PlasmaSample);
export default PlasmaSample;
