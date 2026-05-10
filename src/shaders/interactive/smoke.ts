import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  scale: zFloat(0.3, 12, 0.05).default(2.5).describe("Scale"),
  speed: zFloat(0, 4, 0.05).default(0.4).describe("Speed"),
  density: zFloat(0, 1).default(0.5).describe("Density"),
  softness: zFloat(0.05, 1).default(0.6).describe("Softness"),
  color1: zColor().default([0.99, 0.51, 0.98]).describe("Color 1"),
  color2: zColor().default([0.76, 0.11, 0.47]).describe("Color 2"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Smoke",
  description: "Drifting smoky cloud field",
  color: "#94a3b8",
  category: "interactive",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Smoke extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "smoke";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const scale = this.uniformName("scale");
    const speed = this.uniformName("speed");
    const density = this.uniformName("density");
    const softness = this.uniformName("softness");
    const c1 = this.uniformName("color1");
    const c2 = this.uniformName("color2");
    return {
      dependencies: ["simplex2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - u_mouse) * _ar;
vec2 q = p * ${scale};
float t = u_time * ${speed};
vec2 drift = u_mouseDelta * 5.0;
float v = 0.0;
float amp = 0.5;
for (int i = 0; i < 5; i++) {
  v += simplex2D(q + vec2(t, t * 0.7) + drift) * amp;
  q *= 2.0;
  amp *= 0.5;
}
float n = v * 0.5 + 0.5;
float a = smoothstep(0.5 - ${softness} * 0.5, 0.5 + ${softness} * 0.5, n);
vec3 col = mix(${c1}, ${c2}, n);
return vec4(col, a * ${density});`,
    };
  }
}

register(Smoke);
export default Smoke;
