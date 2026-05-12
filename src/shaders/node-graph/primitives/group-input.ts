// GroupInput — the contract between the node graph and its host layer's
// property pane. Every pin declared here becomes both:
//   - an output on the GroupInput node (so downstream primitives can read it)
//   - a user-facing control in the layer's property panel
//
// Each pin is backed by a uniform; the property pane drives the uniform value,
// and emit() reads the uniform into the node-graph local.

import { z } from "zod";
import { registerPrimitive, type UniformSpec } from "../registry";
import { glslTypeOf, type PinSpec, type PinType } from "../types";

const pinType = z.enum(["float", "vec2", "vec3", "vec4", "bool", "int"]);

// Pin declaration as authored by a preset / saved with the graph. `default`
// is structurally any because its shape depends on the pin type; the property
// pane and emit() inspect `type` to interpret it.
const pinSchema = z.object({
  id: z.string(),
  type: pinType,
  label: z.string().optional(),
  default: z.unknown().optional(),
});

const config = z.object({
  pins: z.array(pinSchema).default([]),
});

type Config = z.infer<typeof config>;

export default registerPrimitive({
  typeId: "group-input",
  name: "Group Input",
  category: "io",
  color: "#22c55e",
  description: "Layer parameters surfaced to the property pane.",
  config,

  inputs() {
    return [];
  },

  outputs(cfg) {
    const c = cfg as Config;
    return c.pins.map(
      (p): PinSpec => ({
        id: p.id,
        type: p.type,
        label: p.label,
        default: p.default as PinSpec["default"],
      }),
    );
  },

  uniforms(node) {
    const c = node.config as Config;
    return c.pins.map(
      (p): UniformSpec => ({
        nameSuffix: p.id,
        type: p.type,
        value: defaultValueFor(p.type, p.default),
      }),
    );
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const lines = c.pins.map((p) => {
      const local = ctx.outputs[p.id];
      const uniform = ctx.uniforms[p.id];
      return `${glslTypeOf(p.type)} ${local} = ${uniform};`;
    });
    return { statements: lines.join("\n") };
  },
});

function defaultValueFor(type: PinType, raw: unknown): unknown {
  switch (type) {
    case "float":
      return typeof raw === "number" ? raw : 0;
    case "int":
      return typeof raw === "number" ? Math.trunc(raw) : 0;
    case "bool":
      return raw === true;
    case "vec2":
      return Array.isArray(raw) && raw.length >= 2 ? [Number(raw[0]) || 0, Number(raw[1]) || 0] : [0, 0];
    case "vec3":
      return Array.isArray(raw) && raw.length >= 3
        ? [Number(raw[0]) || 0, Number(raw[1]) || 0, Number(raw[2]) || 0]
        : [0, 0, 0];
    case "vec4":
      return Array.isArray(raw) && raw.length >= 4
        ? [Number(raw[0]) || 0, Number(raw[1]) || 0, Number(raw[2]) || 0, Number(raw[3]) || 1]
        : [0, 0, 0, 1];
  }
}
