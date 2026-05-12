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
  scale: zFloat(0.1, 64, 0.1).default(5).describe("Scale"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Checker Texture",
  description: "Two-tile alternating checker pattern",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class CheckerTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "checker-texture";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = { scale: "float" };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `
{
  vec2 _cp = p * ${uniforms.scale};
  vec2 _cell = floor(_cp);
  n = mod(_cell.x + _cell.y, 2.0);
}`,
    };
  }
}

register(CheckerTexture);
export default CheckerTexture;
