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
  level: zFloat(0, 1, 0.01).default(0.5).describe("Level"),
  softness: zFloat(0, 0.5, 0.005).default(0.05).describe("Softness"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Threshold",
  description: "Clips the scalar field to a hard or soft step around the level",
  color: "#fb923c",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Threshold extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "threshold";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    level: "float",
    softness: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `n = smoothstep(${uniforms.level} - ${uniforms.softness}, ${uniforms.level} + ${uniforms.softness}, n);`,
    };
  }
}

register(Threshold);
export default Threshold;
