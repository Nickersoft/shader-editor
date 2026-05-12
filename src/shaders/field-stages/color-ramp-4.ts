import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zColor } from "@/shaders/core/schemas";

const config = z.object({
  colorA: zColor().default([0.04, 0.0, 0.08]),
  colorB: zColor().default([0.42, 0.09, 0.9]),
  colorC: zColor().default([1.0, 0.3, 0.42]),
  colorD: zColor().default([1.0, 0.42, 0.21]),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Color Ramp · 4",
  description: "Four-color ramp — colorizes the scalar field across three sub-mixes",
  color: "#a855f7",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class ColorRamp4 extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "color-ramp-4";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    colorA: "vec3",
    colorB: "vec3",
    colorC: "vec3",
    colorD: "vec3",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
if (n < 0.333) {
  col = mix(${uniforms.colorA}, ${uniforms.colorB}, n * 3.0);
} else if (n < 0.666) {
  col = mix(${uniforms.colorB}, ${uniforms.colorC}, (n - 0.333) * 3.0);
} else {
  col = mix(${uniforms.colorC}, ${uniforms.colorD}, (n - 0.666) * 3.0);
}`,
    };
  }
}

register(ColorRamp4);
export default ColorRamp4;
