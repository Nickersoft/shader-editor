// GradientTexture — `p`-derived scalar across a set of canned gradient shapes.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  type: z
    .enum(["linear", "quadratic", "easing", "diagonal", "spherical", "quadratic-sphere", "radial"])
    .default("linear"),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "gradient-texture",
  name: "Gradient Texture",
  category: "sources",
  color: "#06b6d4",
  description: "Canned gradient shapes — linear, radial, spherical, …",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    let expr: string;
    switch (c.type) {
      case "quadratic": {
        const t = `clamp(${p}.x, 0.0, 1.0)`;
        expr = `${t} * ${t}`;
        break;
      }
      case "easing":
        expr = `smoothstep(0.0, 1.0, clamp(${p}.x, 0.0, 1.0))`;
        break;
      case "diagonal":
        expr = `clamp((${p}.x + ${p}.y) * 0.5 + 0.5, 0.0, 1.0)`;
        break;
      case "spherical":
        expr = `clamp(1.0 - length(${p}), 0.0, 1.0)`;
        break;
      case "quadratic-sphere": {
        const r = `clamp(1.0 - length(${p}), 0.0, 1.0)`;
        expr = `${r} * ${r}`;
        break;
      }
      case "radial":
        expr = `(atan(${p}.y, ${p}.x) / 6.2831853 + 0.5)`;
        break;
      case "linear":
      default:
        expr = `clamp(${p}.x * 0.5 + 0.5, 0.0, 1.0)`;
        break;
    }
    return { statements: `float ${o} = ${expr};` };
  },
});
