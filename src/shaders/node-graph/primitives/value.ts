// Const — a single user-editable float that becomes a uniform. Strictly
// speaking the plan inventory doesn't list this, but hand-authoring any
// non-trivial graph needs scalar literals (multiplying by 2π, 30, etc.) and
// `Combine` only accepts pins — so an explicit zero-input float-source node
// avoids forcing every constant through `GroupInput`, which would clutter the
// layer's property pane with editor-internal noise.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({
  value: zFloat(-1000, 1000).default(1),
});

type Config = z.infer<typeof config>;

const pinOut = z.object({
  out: float("Value"),
});

type Out = z.infer<typeof pinOut>;

class Const extends BasePrimitive<Config, Record<string, never>, Out> {
  static readonly typeId = "value";
  static readonly meta: PrimitiveMeta = {
    name: "Value",
    category: "input",
    color: "#64748b",
    description: "A user-editable scalar literal.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };
  static readonly uniformKeys = { value: "float" } as const;

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    return { statements: `float ${ctx.outputs.out} = ${ctx.uniforms.value};` };
  }
}

export default register(Const);
