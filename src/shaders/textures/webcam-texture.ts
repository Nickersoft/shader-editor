// WebcamTexture — schema mirrors shaders.com/docs/components/webcamtexture.
// Runtime hookup (binding a getUserMedia stream to a sampler2D) is not yet
// wired in the host runtime; the GLSL renders a placeholder card.

import { z } from "zod";
import { StaticShader } from "@/shaders/core/shader.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, ShaderMeta } from "@/shaders/core/types";
import { zBool, zColor } from "@/shaders/core/schemas";

const schema = z.object({
  objectFit: z
    .enum(["cover", "contain", "fill", "scale-down", "none"])
    .default("cover")
    .describe("Object Fit"),
  mirror: zBool().default(true).describe("Mirror"),
  placeholder: zColor().default([0.08, 0.1, 0.14]).describe("Placeholder Color"),
});

const meta: ShaderMeta = {
  name: "Webcam Texture",
  description: "Display a live webcam feed with customizable object-fit modes",
  color: "#10b981",
  category: "textures",
  defaultBlendMode: "normal",
};

type Inputs = z.infer<typeof schema>;

export class WebcamTexture extends StaticShader<Inputs> {
  static readonly typeId = "webcam-texture";
  static readonly schema = schema;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const c = this.uniformName("placeholder");
    return { main: `return vec4(${c}, 1.0);` };
  }
}

register(WebcamTexture);
export default WebcamTexture;
