import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zBool, zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({});

const uniforms = z.object({
  density: zFloat(8, 300, 1).default(80).describe("Density"),
  gamma: zFloat(0.5, 3, 0.01).default(1).describe("Gamma"),
  alphaThreshold: zFloat(0, 1).default(0.05).describe("Alpha Threshold"),
  preserveAlpha: zBool().default(true).describe("Preserve Alpha"),
  colorBack: zColor().default([0, 0, 0]).describe("Background"),
  colorChar: zColor().default([0.4, 1, 0.5]).describe("Character"),
});

const meta: NodeMeta = {
  name: "ASCII",
  description: "Coarse ASCII-like dot density",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Ascii extends EffectNode<Config, Uniforms> {
  static readonly typeId = "ascii";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const density = this.uniformName("density");
    const gamma = this.uniformName("gamma");
    const alphaThreshold = this.uniformName("alphaThreshold");
    const preserveAlpha = this.uniformName("preserveAlpha");
    const colorBack = this.uniformName("colorBack");
    const colorChar = this.uniformName("colorChar");
    return {
      main: `
vec2 cells = vec2(${density}, ${density} * (u_resolution.y / max(u_resolution.x, 1.0)));
vec2 cellId = floor(uv * cells);
vec2 cellUv = fract(uv * cells);
vec2 cellSample = (cellId + 0.5) / cells;
vec4 cellColor = texture(u_prevPass, cellSample);
float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
float toned = pow(clamp(lum, 0.0, 1.0), 1.0 / max(${gamma}, 1e-4));
float bars = floor(toned * 4.0);
float fill = step(cellUv.y, bars * 0.25 + 0.05);
float bar  = step(abs(cellUv.x - 0.5), 0.4) * fill;
vec3 rgb = mix(${colorBack}, ${colorChar}, bar);
float srcAlpha = texture(u_prevPass, uv).a;
float outA = ${preserveAlpha} ? srcAlpha : 1.0;
if (srcAlpha < ${alphaThreshold}) outA = 0.0;
return vec4(rgb, outA);`,
    };
  }
}

register(Ascii);
export default Ascii;
