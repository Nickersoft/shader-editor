// Hash — deterministic vec2 → float pseudorandom. Wraps the codegen's
// `hash` helper directly — the underlying function takes a vec2, so the pin
// shape matches and recipes that already have a vec2 (a cell coordinate, a
// transformed `p`) can wire straight through.

import { z } from "zod";
import { float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Hash extends BaseNode<Record<string, never>, In, Out> {
  static readonly typeId = "white-noise-texture";
  static readonly meta: NodeMeta = {
    name: "White Noise Texture",
    category: "texture",
    color: "#f97316",
    description: "Deterministic pseudorandom float in [0,1].",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("hash");
    return {
      statements: `float ${ctx.outputs.out} = hash(${ctx.inputs.p});`,
    };
  }
}

export default register(Hash);
