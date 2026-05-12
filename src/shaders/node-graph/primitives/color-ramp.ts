// ColorRamp — two-stop ramp. The two colors are uniforms so they can be
// edited live without recompile. Multi-stop ramps come in Phase 4 polish.

import { z } from "zod";
import { zVec3 } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  colorA: zVec3().default([0, 0, 0]),
  colorB: zVec3().default([1, 1, 1]),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "t", type: "float", label: "T", default: 0 }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec3", label: "Color" }];

export default registerPrimitive({
  typeId: "color-ramp",
  name: "Color Ramp",
  category: "io",
  color: "#ec4899",
  description: "Two-color ramp driven by a scalar.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [
      { nameSuffix: "colorA", type: "vec3", value: c.colorA } satisfies UniformSpec,
      { nameSuffix: "colorB", type: "vec3", value: c.colorB } satisfies UniformSpec,
    ];
  },

  emit(ctx) {
    const t = ctx.inputs.t;
    const a = ctx.uniforms.colorA;
    const b = ctx.uniforms.colorB;
    return {
      statements: `vec3 ${ctx.outputs.out} = mix(${a}, ${b}, clamp(${t}, 0.0, 1.0));`,
    };
  },
});
