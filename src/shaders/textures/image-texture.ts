import { z } from "zod";
import { StaticShader } from "@/shaders/core/shader.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, ShaderMeta } from "@/shaders/core/types";
import { noImage, zColorRgba, zImageInput } from "@/shaders/core/schemas";

const schema = z.object({
  image: zImageInput().default(noImage).describe("Image"),
  tint: zColorRgba().default([1, 1, 1, 1]).describe("Tint"),
});

const meta: ShaderMeta = {
  name: "Image Texture",
  description: "Sample an uploaded image as a texture",
  color: "#3b82f6",
  category: "textures",
  defaultBlendMode: "normal",
};

type Inputs = z.infer<typeof schema>;

export class ImageTexture extends StaticShader<Inputs> {
  static readonly typeId = "image-texture";
  static readonly schema = schema;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const image = this.uniformName("image");
    const tint = this.uniformName("tint");
    return {
      dependencies: ["applySizing"],
      main: `
vec2 sampleUv = applySizing(uv, ${image}_meta, ${image}_offset);
if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
  return vec4(0.0);
}
vec4 src = texture(${image}, sampleUv);
return src * ${tint};`,
    };
  }
}

register(ImageTexture);
export default ImageTexture;
