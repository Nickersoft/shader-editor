// VideoTexture — schema mirrors shaders.com/docs/components/videotexture.
// Runtime hookup (binding a <video> element to a sampler2D) is not yet wired
// in the host runtime; the GLSL renders a placeholder card so layers compose
// safely in chains until that lands.

import { z } from "zod";
import { StaticShader } from "@/shaders/core/shader.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, ShaderMeta } from "@/shaders/core/types";
import { zBool, zColor } from "@/shaders/core/schemas";

const schema = z.object({
  url: z.string().default("https://shaders.com/sample.mp4").describe("URL"),
  objectFit: z
    .enum(["cover", "contain", "fill", "scale-down", "none"])
    .default("cover")
    .describe("Object Fit"),
  loop: zBool().default(true).describe("Loop"),
  placeholder: zColor().default([0.1, 0.1, 0.12]).describe("Placeholder Color"),
});

const meta: ShaderMeta = {
  name: "Video Texture",
  description: "Display a video with customizable playback and object-fit modes",
  color: "#6366f1",
  category: "textures",
  defaultBlendMode: "normal",
};

type Inputs = z.infer<typeof schema>;

export class VideoTexture extends StaticShader<Inputs> {
  static readonly typeId = "video-texture";
  static readonly schema = schema;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const c = this.uniformName("placeholder");
    return { main: `return vec4(${c}, 1.0);` };
  }
}

register(VideoTexture);
export default VideoTexture;
