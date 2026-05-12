import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  factor: zFloat(0, 1, 0.01).default(0.5).describe("Mix"),
  mode: z.enum(["lerp", "add", "multiply", "min", "max"]).default("lerp").describe("Mode"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Mix Fields",
  description: "Combines two scalar fields wired to its A and B input ports",
  color: "#f59e0b",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class MixFields extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "mix-fields";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = { factor: "float" };
  static readonly auxInputs = ["a", "b"] as const;

  glsl({ uniforms, aux, config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    const a = aux.a;
    const b = aux.b;
    const f = uniforms.factor;
    let expr: string;
    switch (cfg.mode) {
      case "add":
        expr = `clamp(${a} + ${b} * ${f}, 0.0, 1.0)`;
        break;
      case "multiply":
        expr = `mix(${a}, ${a} * ${b}, ${f})`;
        break;
      case "min":
        expr = `mix(${a}, min(${a}, ${b}), ${f})`;
        break;
      case "max":
        expr = `mix(${a}, max(${a}, ${b}), ${f})`;
        break;
      case "lerp":
      default:
        expr = `mix(${a}, ${b}, ${f})`;
        break;
    }
    return { main: `n = ${expr};` };
  }
}

register(MixFields);
export default MixFields;
