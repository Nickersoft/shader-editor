// Strands — procedural wavy strands (composite, outputs color + alpha).
// `pinEdges` is structural so the boolean drops the corresponding GLSL branch
// outright at codegen time.

import { z } from "zod";
import { zFloat, zInt, zVec2, zVec3 } from "@/shaders/core/schemas";
import { color, float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
  type UniformSpec,
} from "../registry";
import type { GraphNode } from "../types";

const config = z.object({
  speed: zFloat(0, 4, 0.05).default(0.5),
  amplitude: zFloat(0, 4, 0.01).default(1),
  frequency: zFloat(0.1, 12, 0.05).default(1),
  lineCount: zInt(1, 80).default(12),
  lineWidth: zFloat(0, 1, 0.01).default(0.1),
  waveColor: zVec3().default([0.95, 0.79, 0.03]),
  pinEdges: z.boolean().default(true),
  start: zVec2().default([0, 0.5]),
  end: zVec2().default([1, 0.5]),
});

type Config = z.infer<typeof config>;

const pinOut = z.object({
  color: color("Color"),
  alpha: float("Alpha"),
});

type Out = z.infer<typeof pinOut>;

class Strands extends BasePrimitive<Config, Record<string, never>, Out> {
  static readonly typeId = "strands";
  static readonly meta: PrimitiveMeta = {
    name: "Strands",
    category: "texture",
    color: "#0ea5e9",
    description: "Procedural wavy strands.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "speed", type: "float", value: c.speed },
      { nameSuffix: "amplitude", type: "float", value: c.amplitude },
      { nameSuffix: "frequency", type: "float", value: c.frequency },
      { nameSuffix: "lineCount", type: "int", value: c.lineCount },
      { nameSuffix: "lineWidth", type: "float", value: c.lineWidth },
      { nameSuffix: "waveColor", type: "vec3", value: c.waveColor },
      { nameSuffix: "start", type: "vec2", value: c.start },
      { nameSuffix: "end", type: "vec2", value: c.end },
    ] satisfies UniformSpec[];
  }

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    ctx.addDependency("aastep");
    const c = this.cfg(ctx.config);
    const o = ctx.outputs.color;
    const a = ctx.outputs.alpha;
    const u = ctx.uniforms;
    const pin = c.pinEdges
      ? `float ${o}_pin = sin(clamp(${o}_along, 0.0, 1.0) * 3.14159);`
      : `float ${o}_pin = 1.0;`;
    return {
      statements: `vec2 ${o}_ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 ${o}_s = ${u.start} * ${o}_ar;
vec2 ${o}_e = ${u.end} * ${o}_ar;
vec2 ${o}_p = uv * ${o}_ar;
vec2 ${o}_axis = ${o}_e - ${o}_s;
float ${o}_l = max(length(${o}_axis), 1e-4);
vec2 ${o}_dir = ${o}_axis / ${o}_l;
vec2 ${o}_per = vec2(-${o}_dir.y, ${o}_dir.x);
float ${o}_along = dot(${o}_p - ${o}_s, ${o}_dir) / ${o}_l;
float ${o}_acr = dot(${o}_p - ${o}_s, ${o}_per);
float ${o}_t = u_time * ${u.speed};
float ${o}_n = float(${u.lineCount});
${pin}
float ${o}_acc = 0.0;
for (int ${o}_i = 0; ${o}_i < 80; ${o}_i++) {
  if (float(${o}_i) >= ${o}_n) break;
  float ${o}_fi = float(${o}_i);
  float ${o}_lk = (${o}_fi + 0.5) / max(${o}_n, 1.0) - 0.5;
  float ${o}_wav = sin(${o}_along * 6.2831 * ${u.frequency} + ${o}_t + ${o}_fi * 0.7) * 0.06 * ${u.amplitude} * ${o}_pin;
  float ${o}_ly = ${o}_lk * 0.6 + ${o}_wav;
  float ${o}_d = abs(${o}_acr - ${o}_ly);
  ${o}_acc = max(${o}_acc, 1.0 - aastep(${u.lineWidth} * 0.05, ${o}_d));
}
vec3 ${o} = ${u.waveColor};
float ${a} = ${o}_acc;`,
    };
  }
}

export default register(Strands);
