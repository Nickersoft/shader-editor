import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { edgeMode, zEdges, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  amount: zFloat(0, 0.4, 0.005).default(0.05).describe("Amount"),
  scale: zFloat(0.5, 20, 0.1).default(3.0).describe("Scale"),
  speed: zFloat(0, 4, 0.05).default(0.5).describe("Speed"),
  stiffness: zFloat(0, 1, 0.01).default(0.5).describe("Stiffness"),
  damping: zFloat(0, 1, 0.01).default(0.5).describe("Damping"),
  edges: zEdges().default("stretch").describe("Edges"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Liquify",
  description: "Soft noise-driven liquid warp",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Liquify extends EffectNode<Config, Inputs> {
  static readonly typeId = "liquify";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const amount = this.uniformName("amount");
    const scale = this.uniformName("scale");
    const speed = this.uniformName("speed");
    const stiffness = this.uniformName("stiffness");
    const damping = this.uniformName("damping");
    return {
      dependencies: ["simplex2D", "applyEdgeHandling", "unpremultiplyAlpha"],
      main: `
float t = u_time * ${speed};
float effScale = ${scale} * mix(2.0, 0.5, ${stiffness});
float effAmount = ${amount} * mix(1.5, 0.5, ${damping});
vec2 toMouse = uv - u_mouse;
float mouseFalloff = exp(-length(toMouse) * 4.0);
float dx = simplex2D(uv * effScale + vec2(t, 0.0));
float dy = simplex2D(uv * effScale + vec2(0.0, t + 7.3));
vec2 finalUV = uv + vec2(dx, dy) * effAmount + toMouse * mouseFalloff * length(u_mouseDelta) * 2.0;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    };
  }
}

register(Liquify);
export default Liquify;
