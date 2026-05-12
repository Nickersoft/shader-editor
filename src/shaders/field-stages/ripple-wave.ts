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
  frequency: zFloat(1, 200, 1).default(20).describe("Frequency"),
  speed: zFloat(0, 4, 0.05).default(1).describe("Speed"),
  phase: zFloat(0, 6.2832, 0.01).default(0).describe("Phase"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Ripple Wave",
  description: "Animated concentric ripple — n = 0.5 + 0.5*cos(r*freq − t*speed)",
  color: "#22d3ee",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class RippleWave extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "ripple-wave";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    frequency: "float",
    speed: "float",
    phase: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
{
  float _rr = length(p);
  float _rw = _rr * ${uniforms.frequency} - t * ${uniforms.speed} * 4.0 + ${uniforms.phase};
  n = 0.5 + 0.5 * cos(_rw);
}`,
    };
  }
}

register(RippleWave);
export default RippleWave;
