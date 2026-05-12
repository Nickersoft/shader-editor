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
  colorA: zColor().default([1, 1, 1]),
  colorB: zColor().default([0, 0, 0]),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Color Ramp · 2",
  description: "Two-color ramp — colorizes the scalar field by mixing colorB → colorA",
  color: "#f472b6",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class ColorRamp2 extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "color-ramp-2";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    colorA: "vec3",
    colorB: "vec3",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return { main: `col = mix(${uniforms.colorB}, ${uniforms.colorA}, n);` };
  }
}

register(ColorRamp2);
export default ColorRamp2;
