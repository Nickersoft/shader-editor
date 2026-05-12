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
  scale: zFloat(0.1, 512, 0.5).default(50).describe("Scale"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "White Noise Texture",
  description: "Per-cell hash-driven random",
  color: "#e5e7eb",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class WhiteNoiseTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "white-noise-texture";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = { scale: "float" };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["hash21"],
      main: `n = hash21(floor(p * ${uniforms.scale}));`,
    };
  }
}

register(WhiteNoiseTexture);
export default WhiteNoiseTexture;
