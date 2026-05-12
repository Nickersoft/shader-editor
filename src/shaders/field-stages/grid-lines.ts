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
  scale: zFloat(0.1, 64, 0.1).default(8).describe("Scale"),
  lineWidth: zFloat(0, 1, 0.005).default(0.08).describe("Line Width"),
  softness: zFloat(0, 1, 0.005).default(0.05).describe("Softness"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Grid Lines",
  description: "Orthogonal grid line pattern — n=1 along lines, n=0 inside cells",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class GridLines extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "grid-lines";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    lineWidth: "float",
    softness: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
{
  vec2 _gp = p * ${uniforms.scale};
  vec2 _gf = abs(fract(_gp) - 0.5);
  float _gm = min(_gf.x, _gf.y);
  float _gw = clamp(${uniforms.lineWidth}, 0.0, 1.0) * 0.5;
  float _gs = clamp(${uniforms.softness}, 0.0, 1.0) * 0.5 + fwidth(_gm);
  n = 1.0 - smoothstep(_gw, _gw + _gs, _gm);
}`,
    };
  }
}

register(GridLines);
export default GridLines;
