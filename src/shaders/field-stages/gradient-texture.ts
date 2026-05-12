import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";

const config = z.object({
  type: z
    .enum([
      "linear",
      "quadratic",
      "easing",
      "diagonal",
      "spherical",
      "quadratic-sphere",
      "radial",
    ])
    .default("linear")
    .describe("Type"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Gradient Texture",
  description: "Seven gradient shapes",
  color: "#f97316",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class GradientTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "gradient-texture";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl({ config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    let expr: string;
    switch (cfg.type) {
      case "quadratic": {
        const t = `clamp(p.x, 0.0, 1.0)`;
        expr = `${t} * ${t}`;
        break;
      }
      case "easing":
        expr = `smoothstep(0.0, 1.0, clamp(p.x, 0.0, 1.0))`;
        break;
      case "diagonal":
        expr = `clamp((p.x + p.y) * 0.5 + 0.5, 0.0, 1.0)`;
        break;
      case "spherical":
        expr = `clamp(1.0 - length(p), 0.0, 1.0)`;
        break;
      case "quadratic-sphere": {
        const r = `clamp(1.0 - length(p), 0.0, 1.0)`;
        expr = `${r} * ${r}`;
        break;
      }
      case "radial":
        expr = `(atan(p.y, p.x) / TWO_PI + 0.5)`;
        break;
      case "linear":
      default:
        expr = `clamp(p.x * 0.5 + 0.5, 0.0, 1.0)`;
        break;
    }
    return {
      dependencies: cfg.type === "radial" ? ["pi"] : [],
      main: `n = ${expr};`,
    };
  }
}

register(GradientTexture);
export default GradientTexture;
