import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageGlsl,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";

const config = z.object({});
const inputs = z.object({});

const meta: NodeMeta = {
  name: "Invert",
  description: "Flips the scalar field — n becomes 1 − n",
  color: "#94a3b8",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Invert extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "invert";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): FieldStageGlsl {
    return { main: `n = 1.0 - n;` };
  }
}

register(Invert);
export default Invert;
