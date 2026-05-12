// Combine — two-input scalar op. Pulled forward from Phase 2 so the Phase 1
// walking skeleton can multiply Time by a GroupInput `speed` pin.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const OPS = [
  "add",
  "sub",
  "mul",
  "div",
  "min",
  "max",
  "mix",
  "step",
  "smoothstep",
  "pow",
  "mod",
] as const;

const config = z.object({
  op: z.enum(OPS).default("mul"),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "a", type: "float", label: "A", default: 0 },
  { id: "b", type: "float", label: "B", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "combine",
  name: "Combine",
  category: "math",
  color: "#a78bfa",
  description: "Two-input scalar math.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const a = ctx.inputs.a;
    const b = ctx.inputs.b;
    const expr = exprFor(c.op, a, b);
    return { statements: `float ${ctx.outputs.out} = ${expr};` };
  },
});

function exprFor(op: Config["op"], a: string, b: string): string {
  switch (op) {
    case "add":
      return `(${a} + ${b})`;
    case "sub":
      return `(${a} - ${b})`;
    case "mul":
      return `(${a} * ${b})`;
    case "div":
      return `(${a} / max(abs(${b}), 1e-6) * sign(${b} + 1e-30))`;
    case "min":
      return `min(${a}, ${b})`;
    case "max":
      return `max(${a}, ${b})`;
    case "mix":
      return `mix(${a}, ${b}, 0.5)`;
    case "step":
      return `step(${a}, ${b})`;
    case "smoothstep":
      return `smoothstep(${a}, ${b}, 0.5)`;
    case "pow":
      return `pow(max(${a}, 0.0), ${b})`;
    case "mod":
      return `mod(${a}, ${b})`;
  }
}
