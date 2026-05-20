// GroupOutput — the single sink of the graph. The emitter reads the pin
// expressions wired into this node and surfaces them up: the root graph
// wraps `color` and `alpha` into `return vec4(<color>, <alpha>);`, and a
// parent group node binds each pin to one of its external output locals.
//
// Pins are config-driven (matching GroupInput's pattern) so make-group can
// synthesise arbitrary output pins for a group's external surface. The
// default config carries the legacy `color: vec3` + `alpha: float` pins so
// every existing root graph continues to terminate the same way; preset
// builders that pass `config: {}` are normalised to the defaults at load.
//
// emit() is a no-op — emit.ts skips this primitive's `emit()` call entirely
// (the expressions are already in scope as upstream locals) so no sentinel
// `_final_*` locals are written, and no name collisions occur when groups
// nest inside groups.

import { z } from "zod";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import { zPinType } from "../pins";
import { type PinSpec, type PinType } from "../types";

const pinSchema = z.object({
  id: z.string(),
  type: zPinType,
  label: z.string().optional(),
  default: z.unknown().optional(),
  subtype: z.enum(["color", "vector", "uv", "angle", "channel"]).optional(),
});

/** The pin set every root graph expects. */
export const DEFAULT_GROUP_OUTPUT_PINS = [
  { id: "color", type: "vec3" as const, label: "Color", default: [0, 0, 0], subtype: "color" as const },
  { id: "alpha", type: "float" as const, label: "Alpha", default: 1 },
];

const config = z.object({
  pins: z.array(pinSchema).default(DEFAULT_GROUP_OUTPUT_PINS),
});

type Config = z.infer<typeof config>;

export class GroupOutput extends BaseNode<Config> {
  static readonly typeId = "group-output";
  static readonly meta: NodeMeta = {
    name: "Group Output",
    category: "group",
    color: "#ef4444",
    description: "Final color and alpha routed to the layer (or the group's external outputs).",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const c = this.cfg(cfg);
    const pins = c.pins?.length ? c.pins : DEFAULT_GROUP_OUTPUT_PINS;
    return pins.map(
      (p): PinSpec => ({
        id: p.id,
        type: p.type as PinType,
        label: p.label,
        default: p.default as PinSpec["default"],
        subtype: p.subtype,
      }),
    );
  }

  emit(_ctx: EmitContext): EmitResult {
    return { statements: "" };
  }
}

export default register(GroupOutput);
