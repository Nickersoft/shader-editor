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
  scale: zFloat(0.1, 12, 0.05).default(2),
  speed: zFloat(0, 8, 0.05).default(1),
  seed: zFloat(0, 100, 0.1).default(0),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Domain Transform",
  description: "Scales, seeds, and time-scales the coordinate domain before sampling",
  color: "#94a3b8",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class FieldSource extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "field-source";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    speed: "float",
    seed: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
p = p * ${uniforms.scale} + ${uniforms.seed};
t = t * ${uniforms.speed} * 0.15;`,
    };
  }
}

register(FieldSource);
export default FieldSource;
