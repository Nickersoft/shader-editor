import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zCenter, zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  colorA: zColor().default([1.0, 0.42, 0.21]).describe("Color A"),
  colorB: zColor().default([0.91, 0.12, 0.39]).describe("Color B"),
  size: zFloat(0, 1).default(0.5).describe("Size"),
  deformation: zFloat(0, 1).default(0.5).describe("Deformation"),
  softness: zFloat(0, 1).default(0.5).describe("Softness"),
  highlightIntensity: zFloat(0, 1).default(0.5).describe("Highlight Intensity"),
  highlightX: zFloat(-1, 1).default(0.3).describe("Highlight X"),
  highlightY: zFloat(-1, 1).default(-0.3).describe("Highlight Y"),
  highlightZ: zFloat(0, 1).default(0.4).describe("Highlight Z"),
  highlightColor: zColor().default([1.0, 0.88, 0.1]).describe("Highlight Color"),
  speed: zFloat(0, 4, 0.05).default(0.5).describe("Speed"),
  seed: zFloat(0, 100, 0.1).default(1).describe("Seed"),
  center: zCenter().default([0.5, 0.5]).describe("Center"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Blob",
  description: "Organic animated blob with 3D lighting and gradients",
  color: "#ff6b35",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Blob extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "blob";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const colorA = this.uniformName("colorA");
    const colorB = this.uniformName("colorB");
    const size = this.uniformName("size");
    const deformation = this.uniformName("deformation");
    const softness = this.uniformName("softness");
    const hlIntensity = this.uniformName("highlightIntensity");
    const hlX = this.uniformName("highlightX");
    const hlY = this.uniformName("highlightY");
    const hlZ = this.uniformName("highlightZ");
    const hlColor = this.uniformName("highlightColor");
    const speed = this.uniformName("speed");
    const seed = this.uniformName("seed");
    const center = this.uniformName("center");
    return {
      dependencies: ["fbm", "simplex2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
float t = u_time * ${speed};
float r0 = ${size} * 0.45 + 0.05;

float ang = atan(p.y, p.x);
float def = ${deformation};
float warp = 0.0;
warp += sin(ang * 3.0 + t * 0.7 + ${seed}) * 0.18;
warp += sin(ang * 5.0 - t * 1.1 + ${seed} * 1.7) * 0.10;
warp += fbm(vec2(cos(ang), sin(ang)) * 2.0 + t * 0.2 + ${seed}, 3.0, 2.0, 0.5) * 0.25;
float radius = r0 * (1.0 + warp * def);

float d = length(p) - radius;
float edge = mix(0.005, 0.20, ${softness});
float mask = 1.0 - smoothstep(-edge, edge, d);

float fill = clamp(length(p) / max(radius, 1e-4), 0.0, 1.0);
vec3 bg = mix(${colorA}, ${colorB}, fill);

float inside = clamp(-d / max(radius, 1e-4), 0.0, 1.0);
float h = sqrt(max(inside, 0.0));
vec2 grad = vec2(dFdx(d), dFdy(d));
vec3 N = normalize(vec3(-grad * 4.0, max(h, 0.001)));
vec3 L = normalize(vec3(${hlX}, ${hlY}, max(${hlZ}, 0.05)));
float spec = pow(max(dot(N, L), 0.0), 24.0);
vec3 hilite = ${hlColor} * spec * ${hlIntensity} * 1.6;

vec3 col = bg + hilite * mask;
return vec4(col * mask, mask);`,
    };
  }
}

register(Blob);
export default Blob;
