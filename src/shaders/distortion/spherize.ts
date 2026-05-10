import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zAngle, zCenterAxis, zColor, zEdges, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  centerX: zCenterAxis().default(0.5).describe("Center X"),
  centerY: zCenterAxis().default(0.5).describe("Center Y"),
  radius: zFloat(0, 1, 0.01).default(0.5).describe("Radius"),
  depth: zFloat(0, 2, 0.01).default(1.0).describe("Depth"),
  lightAngle: zAngle().default(45.0).describe("Light Angle"),
  lightIntensity: zFloat(0, 2, 0.01).default(0.5).describe("Light Intensity"),
  lightSoftness: zFloat(0, 1, 0.01).default(0.5).describe("Light Softness"),
  lightColor: zColor().default([1, 1, 1]).describe("Light Color"),
  edges: zEdges().default("stretch").describe("Edges"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Spherize",
  description: "Sphere lens distortion with directional light",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Spherize extends EffectNode<Config, Inputs> {
  static readonly typeId = "spherize";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const cx = this.uniformName("centerX");
    const cy = this.uniformName("centerY");
    const radius = this.uniformName("radius");
    const depth = this.uniformName("depth");
    const lightAngle = this.uniformName("lightAngle");
    const lightIntensity = this.uniformName("lightIntensity");
    const lightSoftness = this.uniformName("lightSoftness");
    const lightColor = this.uniformName("lightColor");
    return {
      dependencies: ["pi", "applyEdgeHandling", "unpremultiplyAlpha"],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 centerPos = vec2(${cx} * aspect, ${cy});
vec2 p = aspectUV - centerPos;
float r = length(p);
float effR = max(${radius}, 1e-4);
vec2 finalUV = uv;
float light = 0.0;
if (r < effR) {
  float t = r / effR;
  float theta = asin(clamp(t, 0.0, 1.0));
  float newR = sin(theta * ${depth}) * effR;
  vec2 dir = r > 1e-6 ? p / r : vec2(0.0);
  vec2 newP = centerPos + dir * newR;
  finalUV = vec2(newP.x / aspect, newP.y);
  float la = ${lightAngle} * PI / 180.0;
  vec3 n = normalize(vec3(p.x, p.y, sqrt(max(1.0 - t * t, 0.0)) * effR));
  vec3 L = vec3(cos(la), sin(la), 0.5);
  float ndl = max(dot(n, normalize(L)), 0.0);
  light = pow(ndl, 1.0 / max(${lightSoftness}, 0.01)) * ${lightIntensity};
}
vec4 sampled = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));
vec3 lit = mix(sampled.rgb, ${lightColor}, clamp(light, 0.0, 1.0));
return vec4(lit, sampled.a);`,
    };
  }
}

register(Spherize);
export default Spherize;
