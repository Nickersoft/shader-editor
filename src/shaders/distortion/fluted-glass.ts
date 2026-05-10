import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zAngle, zColor, zEdges, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  frequency: zFloat(1, 50, 0.5).default(8.0).describe("Frequency"),
  softness: zFloat(0, 1, 0.01).default(0.5).describe("Softness"),
  refraction: zFloat(0, 1, 0.01).default(0.5).describe("Refraction"),
  aberration: zFloat(0, 1, 0.01).default(0.0).describe("Aberration"),
  lightAngle: zAngle().default(45.0).describe("Light Angle"),
  highlight: zFloat(0, 2, 0.01).default(0.5).describe("Highlight"),
  highlightSoftness: zFloat(0, 1, 0.01).default(0.5).describe("Highlight Softness"),
  highlightColor: zColor().default([1, 1, 1]).describe("Highlight Color"),
  edges: zEdges().default("mirror").describe("Edges"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Fluted Glass",
  description: "Refractive vertical fluting with chromatic aberration and highlight",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class FlutedGlass extends EffectNode<Config, Inputs> {
  static readonly typeId = "fluted-glass";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const frequency = this.uniformName("frequency");
    const softness = this.uniformName("softness");
    const refraction = this.uniformName("refraction");
    const aberration = this.uniformName("aberration");
    const lightAngle = this.uniformName("lightAngle");
    const highlight = this.uniformName("highlight");
    const highlightSoftness = this.uniformName("highlightSoftness");
    const highlightColor = this.uniformName("highlightColor");
    return {
      dependencies: ["pi", "applyEdgeHandling", "unpremultiplyAlpha"],
      main: `
float t = sin(uv.x * ${frequency} * PI);
float ts = sign(t) * pow(abs(t), mix(1.0, 0.3, ${softness}));
float refrX = ts * ${refraction} * 0.05;
vec2 finalUV = vec2(uv.x + refrX, uv.y);
float chr = ts * ${aberration} * 0.025;
vec4 rS = applyEdgeHandling(u_prevPass, vec2(finalUV.x + chr, finalUV.y), ${edgeMode(this.config.edges)});
vec4 gS = applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)});
vec4 bS = applyEdgeHandling(u_prevPass, vec2(finalUV.x - chr, finalUV.y), ${edgeMode(this.config.edges)});
vec4 sampled = unpremultiplyAlpha(vec4(rS.r, gS.g, bS.b, gS.a));
float softInv = 1.0 / max(${highlightSoftness}, 0.01);
float spec = pow(max(1.0 - abs(t), 0.0), softInv) * ${highlight};
float la = ${lightAngle} * PI / 180.0;
float lightFactor = max(cos(la - uv.x * PI), 0.0);
spec *= lightFactor;
vec3 lit = mix(sampled.rgb, ${highlightColor}, clamp(spec, 0.0, 1.0));
return vec4(lit, sampled.a);`,
    };
  }
}

register(FlutedGlass);
export default FlutedGlass;
