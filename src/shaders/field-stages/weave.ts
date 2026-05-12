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
  gap: zFloat(0, 0.5, 0.005).default(0.25).describe("Gap"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Weave",
  description: "Over/under thread weave — n=1 on threads (alternating per cell)",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Weave extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "weave";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    gap: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["aastep"],
      main: `
{
  vec2 _wq = p * ${uniforms.scale};
  vec2 _wcell = floor(_wq);
  vec2 _wf = fract(_wq) - 0.5;
  bool _waOver = mod(_wcell.x + _wcell.y, 2.0) < 0.5;
  float _wth = (0.5 - clamp(${uniforms.gap}, 0.0, 0.5)) * 0.5 + 0.05;
  float _wh = 1.0 - aastep(_wth, abs(_wf.y));
  float _wv = 1.0 - aastep(_wth, abs(_wf.x));
  float _wam = _waOver ? _wh : _wh * 0.5;
  float _wbm = _waOver ? _wv * 0.5 : _wv;
  n = max(_wam, _wbm);
}`,
    };
  }
}

register(Weave);
export default Weave;
