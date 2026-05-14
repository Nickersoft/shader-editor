// Time — exposes the global `u_time` uniform as a float output pin.

import { z } from "zod";
import { float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({});

const pinOut = z.object({
  out: float("Time"),
});

type Out = z.infer<typeof pinOut>;

class Time extends BasePrimitive<Record<string, never>, Record<string, never>, Out> {
  static readonly typeId = "time";
  static readonly meta: PrimitiveMeta = {
    name: "Time",
    category: "input",
    color: "#0ea5e9",
    description: "Elapsed time in seconds.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    return { statements: `float ${ctx.outputs.out} = u_time;` };
  }
}

export default register(Time);
