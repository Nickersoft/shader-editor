import { z } from "zod";
import { StaticShader } from "@/shaders/core/shader.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, ShaderMeta } from "@/shaders/core/types";
import { zColor, zFloat } from "@/shaders/core/schemas";

const schema = z.object({
  intensity: zFloat(0, 1).default(0.5).describe("Intensity"),
  speed: zFloat(0, 2, 0.05).default(0.5).describe("Speed"),
  scale: zFloat(0.1, 5, 0.05).default(1.0).describe("Scale"),
  color1: zColor().default([0.0, 0.4, 1.0]).describe("Color 1"),
  color2: zColor().default([0.0, 1.0, 0.4]).describe("Color 2"),
  color3: zColor().default([1.0, 0.0, 0.4]).describe("Color 3"),
  color4: zColor().default([0.2, 0.0, 1.0]).describe("Color 4"),
  color5: zColor().default([1.0, 1.0, 0.2]).describe("Color 5"),
});

const meta: ShaderMeta = {
  name: "Chroma Flow",
  description: "Animated multi-color simplex flow",
  color: "#a855f7",
  category: "interactive",
  defaultBlendMode: "normal",
};

type Inputs = z.infer<typeof schema>;

// ChromaFlow is a generator layer (mixes onto the base layer below it). It
// can't migrate to GraphEffectBase without changing scene-graph semantics
// (effects must live inside a layer's `effects[]` rather than as a standalone
// layer). Stays monolithic until a graph-generator base lands.
export class ChromaFlow extends StaticShader<Inputs> {
  static readonly typeId = "chroma-flow";
  static readonly schema = schema;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const intensity = this.uniformName("intensity");
    const speed = this.uniformName("speed");
    const scale = this.uniformName("scale");
    const c1 = this.uniformName("color1");
    const c2 = this.uniformName("color2");
    const c3 = this.uniformName("color3");
    const c4 = this.uniformName("color4");
    const c5 = this.uniformName("color5");
    return {
      dependencies: ["simplex2D"],
      main: `
vec2 q = (uv - u_mouse) * ${scale};
float t = u_time * ${speed};
float n1 = simplex2D(q + vec2(t, 0.0)) * 0.5 + 0.5;
float n2 = simplex2D(q * 1.3 - vec2(t * 0.7, 0.0)) * 0.5 + 0.5;
float n3 = simplex2D(q * 0.7 + vec2(0.0, t * 0.5)) * 0.5 + 0.5;
float n4 = simplex2D(q * 1.7 + vec2(t * 0.3, t * 0.6)) * 0.5 + 0.5;
vec3 a = mix(${c1}, ${c2}, n1);
vec3 b = mix(${c3}, ${c4}, n2);
vec3 c = mix(a, b, n3);
vec3 flow = mix(c, ${c5}, n4);
return vec4(mix(base.rgb, flow, ${intensity}), base.a);`,
    };
  }
}

register(ChromaFlow);
export default ChromaFlow;
