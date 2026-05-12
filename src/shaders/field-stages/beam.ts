import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zAngle, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  angle: zAngle(1).default(0).describe("Angle"),
  width: zFloat(0, 1, 0.005).default(0.2).describe("Width"),
  softness: zFloat(0, 1, 0.005).default(0.3).describe("Softness"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Beam",
  description: "Directional beam mask — n=1 along the axis, falls off perpendicular",
  color: "#fde68a",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Beam extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "beam";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    angle: "float",
    width: "float",
    softness: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
{
  float _ba = radians(${uniforms.angle});
  vec2 _bn = vec2(-sin(_ba), cos(_ba));
  float _bd = abs(dot(p, _bn));
  float _bw = clamp(${uniforms.width}, 0.0, 1.0) * 0.5;
  float _bs = clamp(${uniforms.softness}, 0.0, 1.0) * 0.5 + fwidth(_bd);
  n = 1.0 - smoothstep(_bw, _bw + _bs, _bd);
}`,
    };
  }
}

register(Beam);
export default Beam;
