import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  brightness: zFloat(-1, 1).default(0).describe("Brightness"),
  contrast: zFloat(-1, 1).default(0).describe("Contrast"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Brightness/Contrast",
  description: "Brightness and contrast adjustment",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class BrightnessContrast extends EffectNode<Config, Inputs> {
  static readonly typeId = "brightness-contrast";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const brightness = this.uniformName("brightness");
    const contrast = this.uniformName("contrast");
    return {
      main: `
base = texture(u_prevPass, uv);
vec3 col = (base.rgb - 0.5) * (${contrast} + 1.0) + 0.5 + ${brightness};
return vec4(col, base.a);`,
    };
  }
}

register(BrightnessContrast);
export default BrightnessContrast;
