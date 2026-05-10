import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.5).describe("Intensity"),
  facets: zFloat(1, 30, 0.5).default(8).describe("Facets"),
  chromaticAberration: zFloat(0, 1, 0.01).default(0.3).describe("Chromatic Aberration"),
  fresnel: zFloat(0, 1, 0.01).default(0.5).describe("Fresnel"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Crystal",
  description: "Crystalline faceted refraction",
  color: "#a78bfa",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Crystal extends EffectNode<Config, Inputs> {
  static readonly typeId = "crystal";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const facets = this.uniformName("facets");
    const ca = this.uniformName("chromaticAberration");
    const fresnel = this.uniformName("fresnel");
    return {
      dependencies: ["hash2"],
      main: `
vec2 q = uv * ${facets};
vec2 cell = floor(q);
vec2 fpos = fract(q);
vec2 offset = (hash2(cell) - 0.5) * 2.0 * ${intensity} * 0.05;
float caStrength = ${ca} * 0.015;
vec2 caDir = normalize(offset + vec2(1e-5));
float r = texture(u_prevPass, uv + offset + caDir * caStrength).r;
vec4 g = texture(u_prevPass, uv + offset);
float b = texture(u_prevPass, uv + offset - caDir * caStrength).b;
vec2 edgeDist = min(fpos, 1.0 - fpos);
float rim = 1.0 - smoothstep(0.0, 0.15, min(edgeDist.x, edgeDist.y));
vec3 col = vec3(r, g.g, b) + rim * ${fresnel};
return vec4(col, g.a);`,
    };
  }
}

register(Crystal);
export default Crystal;
