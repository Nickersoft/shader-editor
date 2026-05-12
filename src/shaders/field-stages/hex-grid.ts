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
  scale: zFloat(0.1, 80, 0.1).default(8).describe("Scale"),
  lineWidth: zFloat(0, 4, 0.05).default(1).describe("Line Width"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Hex Grid",
  description: "Honeycomb hexagonal grid — n=1 along edges, n=0 inside cells",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class HexGridStage extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "hex-grid";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    lineWidth: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["aastep"],
      main: `
{
  vec2 _hq = p * ${uniforms.scale};
  const vec2 _hh = vec2(1.0, 1.7320508);
  vec2 _ha = mod(_hq, _hh) - _hh * 0.5;
  vec2 _hb = mod(_hq - _hh * 0.5, _hh) - _hh * 0.5;
  vec2 _hg = (dot(_ha, _ha) < dot(_hb, _hb)) ? _ha : _hb;
  _hg = abs(_hg);
  float _hd = max(_hg.x, _hg.x * 0.5 + _hg.y * 0.866025);
  float _hw = clamp(${uniforms.lineWidth}, 0.0, 4.0) * 0.025;
  n = aastep(0.5 - _hw, _hd);
}`,
    };
  }
}

register(HexGridStage);
export default HexGridStage;
