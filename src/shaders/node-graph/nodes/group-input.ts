// GroupInput — the contract between the node graph and its host layer's
// property pane. Every pin declared here becomes both:
//   - an output on the GroupInput node (so downstream primitives can read it)
//   - a user-facing control in the layer's property panel
//
// Each pin is backed by a uniform; the property pane drives the uniform value,
// and emit() reads the uniform into the node-graph local.

import { z } from "zod";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
  type UniformSpec,
} from "../registry";
import { zPinType } from "../pins";
import { coerceToPinDefault, glslTypeOf, type GraphNode, type PinSpec } from "../types";

// Pin declaration as authored by a preset / saved with the graph. `default`
// is structurally any because its shape depends on the pin type; the property
// pane and emit() inspect `type` to interpret it.
const pinSchema = z.object({
  id: z.string(),
  type: zPinType,
  label: z.string().optional(),
  default: z.unknown().optional(),
});

const config = z.object({
  pins: z.array(pinSchema).default([]),
});

type Config = z.infer<typeof config>;

export class GroupInput extends BaseNode<Config> {
  static readonly typeId = "group-input";
  static readonly meta: NodeMeta = {
    name: "Group Input",
    category: "group",
    color: "#22c55e",
    description: "Layer parameters surfaced to the property pane.",
  };
  static readonly config = config;

  outputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const c = this.cfg(cfg);
    return c.pins.map(
      (p): PinSpec => ({
        id: p.id,
        type: p.type,
        label: p.label,
        default: p.default as PinSpec["default"],
      }),
    );
  }

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return c.pins.map(
      (p, i): UniformSpec => ({
        nameSuffix: p.id,
        type: p.type,
        value: coerceToPinDefault(p.type, p.default),
        // Live value reads from the pin's `default` field — the property pane
        // edits it in place, so `default` doubles as the current value.
        valuePath: ["pins", String(i), "default"],
      }),
    );
  }

  emit(ctx: EmitContext): EmitResult {
    const c = this.cfg(ctx.config);
    const lines = c.pins.map((p) => {
      const local = ctx.outputs[p.id];
      const uniform = ctx.uniforms[p.id];
      return `${glslTypeOf(p.type)} ${local} = ${uniform};`;
    });
    return { statements: lines.join("\n") };
  }
}

export default register(GroupInput);
