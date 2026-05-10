import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat, zInt } from "@/shaders/core/schemas";

const config = z.object({
  lightX: zFloat(0, 1).default(0.5).describe("Light X"),
  lightY: zFloat(0, 1).default(0.5).describe("Light Y"),
  intensity: zFloat(0, 2).default(1).describe("Intensity"),
  ghosts: zInt(0, 8).default(4).describe("Ghosts"),
  ghostSpacing: zFloat(0, 1).default(0.3).describe("Ghost Spacing"),
  haloSize: zFloat(0, 1).default(0.5).describe("Halo Size"),
  streakLength: zFloat(0, 1).default(0.3).describe("Streak Length"),
  color: zColor().default([1.0, 0.9, 0.7]).describe("Color"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Lens Flare",
  description: "Anamorphic lens flare with ghosts, halo, and streak",
  color: "#fde047",
  category: "stylize",
  defaultBlendMode: "add",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class LensFlare extends EffectNode<Config, Inputs> {
  static readonly typeId = "lens-flare";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const lx = this.uniformName("lightX");
    const ly = this.uniformName("lightY");
    const intensity = this.uniformName("intensity");
    const ghosts = this.uniformName("ghosts");
    const ghostSpacing = this.uniformName("ghostSpacing");
    const haloSize = this.uniformName("haloSize");
    const streakLength = this.uniformName("streakLength");
    const color = this.uniformName("color");
    return {
      main: `
base = texture(u_prevPass, uv);
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 center = vec2(${lx}, ${ly});
vec2 p = (uv - center) * _ar;
float r = length(p);

float core = exp(-r * r * 60.0);

float halo = exp(-pow(abs(r - ${haloSize}) * 8.0, 2.0));

float streak = exp(-abs(p.y) * 80.0) * exp(-abs(p.x) / max(${streakLength}, 1e-4));

float ghostsAcc = 0.0;
int N = ${ghosts};
for (int i = 1; i <= 8; i++) {
  if (i > N) break;
  vec2 g = (center - uv) * (float(i) / float(max(N, 1))) * ${ghostSpacing};
  vec2 gp = ((uv + g) - center) * _ar;
  float gd = length(gp);
  ghostsAcc += exp(-gd * gd * 80.0) * (1.0 / float(i));
}

float v = (core + halo * 0.6 + streak * 0.7 + ghostsAcc * 0.8) * ${intensity};
vec3 rgb = ${color} * v;
return vec4(rgb, clamp(v, 0.0, 1.0));`,
    };
  }
}

register(LensFlare);
export default LensFlare;
