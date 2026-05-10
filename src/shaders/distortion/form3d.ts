import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zCenterAxis, zEdges, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  centerX: zCenterAxis().default(0.5).describe("Center X"),
  centerY: zCenterAxis().default(0.5).describe("Center Y"),
  pan: zFloat(-90, 90, 0.5).default(0.0).describe("Pan (deg)"),
  tilt: zFloat(-90, 90, 0.5).default(0.0).describe("Tilt (deg)"),
  fov: zFloat(30, 120, 1).default(60.0).describe("FOV (deg)"),
  edges: zEdges().default("transparent").describe("Edges"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Form 3D",
  description: "Pseudo-3D pan/tilt projection",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Form3D extends EffectNode<Config, Inputs> {
  static readonly typeId = "form3d";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const cx = this.uniformName("centerX");
    const cy = this.uniformName("centerY");
    const pan = this.uniformName("pan");
    const tilt = this.uniformName("tilt");
    const fov = this.uniformName("fov");
    return {
      dependencies: ["pi", "applyEdgeHandling", "unpremultiplyAlpha"],
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 p = uv - c;
float panR = ${pan} * PI / 180.0;
float tiltR = ${tilt} * PI / 180.0;
float fovScale = tan(${fov} * PI / 360.0);
p *= fovScale;
float denomY = 1.0 + p.x * tan(panR);
float warpedX = p.x;
float warpedY = p.y / max(denomY, 0.001);
float denomX = 1.0 + warpedY * tan(tiltR);
warpedX = warpedX / max(denomX, 0.001);
vec2 finalUV = vec2(warpedX, warpedY) + c;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    };
  }
}

register(Form3D);
export default Form3D;
