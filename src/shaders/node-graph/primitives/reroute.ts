// Reroute — a transparent pin-through used to tame long wires. One input,
// one output, both of the same type. The type is held in `config.pinType`
// and is auto-set by the editor when an upstream connection is made (see
// composer.connectGraphEdge), so users never have to pick it manually.
//
// Emit is a single-line alias — the optimiser will fold it away, and the
// reroute exists purely as a routing waypoint on the canvas.

import { z } from "zod";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";
import { zPinType } from "../pins";
import { glslTypeOf, type PinSpec } from "../types";

const config = z.object({
  pinType: zPinType.default("float"),
});

type Config = z.infer<typeof config>;

class Reroute extends BasePrimitive<Config> {
  static readonly typeId = "reroute";
  static readonly meta: PrimitiveMeta = {
    name: "Reroute",
    category: "group",
    color: "#94a3b8",
    description: "Pin-through waypoint for tidying long wires.",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    return [{ id: "in", type: this.cfg(cfg).pinType, label: "" }];
  }

  outputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    return [{ id: "out", type: this.cfg(cfg).pinType, label: "" }];
  }

  // No title or chip in the body — the dot-style renderer ignores them. Kept
  // here so list views (palette, search) still surface a sensible label.
  displayTitle(cfg: Record<string, unknown>): string {
    return `Reroute · ${this.cfg(cfg).pinType}`;
  }

  emit(ctx: EmitContext): EmitResult {
    const t = this.cfg(ctx.config).pinType;
    return { statements: `${glslTypeOf(t)} ${ctx.outputs.out} = ${ctx.inputs.in};` };
  }
}

export default register(Reroute);
