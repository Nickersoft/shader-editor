import { z } from "zod";
import { EffectNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  amount: zFloat(0, 0.4, 0.005).default(0.05).describe("Amount"),
  scale: zFloat(1, 30, 0.5).default(4.0).describe("Scale"),
  speed: zFloat(0, 4, 0.05).default(0.5).describe("Speed"),
  decay: zFloat(0, 1, 0.01).default(0.9).describe("Decay"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Grid Distortion",
  description: "Mesh-style noise warp",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class GridDistortion extends EffectNode<Config, Inputs> {
  static readonly typeId = "grid-distortion";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const amount = this.uniformName("amount");
    const scale = this.uniformName("scale");
    const speed = this.uniformName("speed");
    const decay = this.uniformName("decay");
    return {
      dependencies: ["simplex2D"],
      main: `
float t = u_time * ${speed};
vec2 q = uv * ${scale};
float mousePush = exp(-distance(uv, u_mouse) * 4.0);
vec2 offset = vec2(simplex2D(q + t), simplex2D(q + t + 13.7)) * ${amount} * ${decay};
offset += (uv - u_mouse) * mousePush * length(u_mouseDelta) * 5.0;
return texture(u_prevPass, uv + offset);`,
    };
  }
}

register(GridDistortion);
export default GridDistortion;
