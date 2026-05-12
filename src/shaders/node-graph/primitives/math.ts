// Math — single-input scalar math op. The op is per-instance config; the
// primitive itself is one node, the dropdown switches its emit output.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const OPS = [
  "sin",
  "cos",
  "tan",
  "abs",
  "floor",
  "fract",
  "sqrt",
  "exp",
  "log",
  "sign",
  "neg",
  "oneminus",
] as const;

const config = z.object({
  op: z.enum(OPS).default("sin"),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "x", type: "float", label: "X", default: 0 }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "math",
  name: "Math",
  category: "math",
  color: "#a78bfa",
  description: "Single-input scalar math.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const x = ctx.inputs.x;
    const expr = exprFor(c.op, x);
    return { statements: `float ${ctx.outputs.out} = ${expr};` };
  },
});

function exprFor(op: Config["op"], x: string): string {
  switch (op) {
    case "sin":
      return `sin(${x})`;
    case "cos":
      return `cos(${x})`;
    case "tan":
      return `tan(${x})`;
    case "abs":
      return `abs(${x})`;
    case "floor":
      return `floor(${x})`;
    case "fract":
      return `fract(${x})`;
    case "sqrt":
      return `sqrt(max(${x}, 0.0))`;
    case "exp":
      return `exp(${x})`;
    case "log":
      return `log(max(${x}, 1e-6))`;
    case "sign":
      return `sign(${x})`;
    case "neg":
      return `-(${x})`;
    case "oneminus":
      return `(1.0 - ${x})`;
  }
}
