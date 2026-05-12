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
  scale: zFloat(0.1, 80, 0.1).default(10).describe("Scale"),
  lineWidth: zFloat(0, 8, 0.05).default(2).describe("Line Width"),
  seed: zFloat(0, 100, 1).default(0).describe("Seed"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Truchet",
  description: "Quarter-circle arc tiles — n=1 on arcs, n=0 elsewhere",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Truchet extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "truchet";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    lineWidth: "float",
    seed: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["aastep", "hash"],
      main: `
{
  vec2 _tq = p * ${uniforms.scale};
  vec2 _tcell = floor(_tq);
  vec2 _tf = fract(_tq);
  float _th = hash(_tcell + ${uniforms.seed});
  if (_th < 0.5) _tf = vec2(_tf.x, 1.0 - _tf.y);
  float _td1 = abs(length(_tf) - 0.5);
  float _td2 = abs(length(_tf - vec2(1.0)) - 0.5);
  float _tdd = min(_td1, _td2);
  float _tlw = clamp(${uniforms.lineWidth}, 0.0, 8.0) * 0.025;
  n = 1.0 - aastep(_tlw, _tdd);
}`,
    };
  }
}

register(Truchet);
export default Truchet;
