// Loop — seamless time-loop helper. Given a continuous `t` (e.g. u_time) and
// a `period`, emits two phase signals offset by half-period plus a crossfade
// factor so a sampling function evaluated at (phaseA) and (phaseB) and mixed
// by `mix` repeats perfectly every `period` seconds.
//
// Pattern (from the legacy polar-flow-field implementation):
//   tA wraps at t = period, 3*period, ... → mix = 1 (show tB)
//   tB wraps at t = 0, 2*period, ...      → mix = 0 (show tA)
// Discontinuities are always hidden at the moment of the crossfade.
//
// When `period <= 0` the loop disables: phaseA = phaseB = t, mix = 0.

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

const pinIn = z.object({
  t: float("Time", 0),
  period: float("Period", 0),
});

const pinOut = z.object({
  "phase-a": float("Phase A"),
  "phase-b": float("Phase B"),
  mix: float("Mix"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class Loop extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "loop";
  static readonly meta: PrimitiveMeta = {
    name: "Loop",
    category: "input",
    color: "#0ea5e9",
    description: "Seamless time-loop: emit two offset phases plus a crossfade for period-wrapping samplers.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("seamlessLoopBlend");
    const t = ctx.inputs.t;
    const p = ctx.inputs.period;
    const a = ctx.outputs["phase-a"];
    const b = ctx.outputs["phase-b"];
    const m = ctx.outputs.mix;
    // step() picks between loop-on and loop-off without a branch. The 2*period
    // sample-wrap period gives each phase a clean discontinuity at the moment
    // the other one is fully visible.
    return {
      statements: `float ${a}_use = step(1e-4, ${p});
float ${a}_dur = max(${p}, 1e-3);
float ${a}_per = 2.0 * ${a}_dur;
float ${a} = mix(${t}, mod(${t} + ${a}_dur, ${a}_per), ${a}_use);
float ${b} = mix(${t}, mod(${t},            ${a}_per), ${a}_use);
float ${m} = ${a}_use * seamlessLoopBlend(${t}, ${p});`,
    };
  }
}

export default register(Loop);
