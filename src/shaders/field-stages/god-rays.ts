import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zCenter, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  center: zCenter(2).default([0, 0]).describe("Center"),
  density: zFloat(0, 1, 0.01).default(0.3).describe("Density"),
  decay: zFloat(0, 4, 0.01).default(0.6).describe("Decay"),
  weight: zFloat(0, 1, 0.01).default(0.8).describe("Weight"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "God Rays",
  description: "Sun-relative radial rays — n peaks along the rays, decays with distance",
  color: "#facc15",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class GodRays extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "god-rays";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    center: "vec2",
    density: "float",
    decay: "float",
    weight: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["valueNoise"],
      main: `
{
  vec2 _gd = p - ${uniforms.center};
  float _gr = length(_gd);
  float _ga = atan(_gd.y, _gd.x);
  float _gf = ${uniforms.density} * 30.0 + 1.0;
  float _gn1 = valueNoise(vec2(_ga * _gf, _gr * 2.0 - t * 0.6));
  float _gn2 = valueNoise(vec2(_ga * _gf * 2.5, _gr * 1.2 - t * 0.4));
  float _gw = 4.0 - 3.0 * clamp(${uniforms.weight}, 0.0, 1.0);
  float _gp = pow(clamp(_gn1 * _gn2, 0.0, 1.0), _gw);
  float _gdecay = exp(-_gr * ${uniforms.decay});
  n = clamp(_gp * _gdecay, 0.0, 1.0);
}`,
    };
  }
}

register(GodRays);
export default GodRays;
