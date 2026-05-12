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
  amplitude: zFloat(0, 2, 0.01).default(0.5),
  detail: zInt(1, 6).default(4),
  scale: zFloat(0.1, 4, 0.05).default(1),
  timePhase: zFloat(0, 4, 0.05).default(1),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Domain Warp",
  description: "Offsets p by an FBM noise field — bends the domain organically",
  color: "#22d3ee",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class DomainWarp extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "domain-warp";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    amplitude: "float",
    detail: "int",
    scale: "float",
    timePhase: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["fbm", "simplex2D"],
      main: `
{
  vec2 _wp = p * ${uniforms.scale};
  float _wt = t * ${uniforms.timePhase};
  p += ${uniforms.amplitude} * vec2(
    fbm(_wp + vec2(_wt, 0.0), float(${uniforms.detail}), 2.0, 0.5),
    fbm(_wp + vec2(0.0, _wt), float(${uniforms.detail}), 2.0, 0.5)
  );
}`,
    };
  }
}

register(DomainWarp);
export default DomainWarp;
