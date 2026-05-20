// Oscillator — scalar harmonic wave: `wave(x*freq + t*timeFreq + phase) · amp`.
//
// Not a 1:1 mirror of a Blender node — Wave Texture is the closest cousin but
// it takes a vector position and produces a unipolar texture along it. This
// primitive is the scalar version, so the phase argument is a *float*
// (typically a UV component, a polar angle, or a derived axis like `wx`) and
// the time component is exposed as a separate `t`/`timeFreq` pair so the
// scene's u_time can drive frequency-domain animation without an external
// add/mul.
//
// Composing `sin(a*x + b*t + c) * d` by hand needs 4–5 Math nodes; this
// primitive collapses that to one. Used heavily by aurora's curtain
// harmonics and ray-shimmer pass.
//
// Config:
//   - profile: sine | cosine. Cosine is a phase-shifted sine; both kept as
//     explicit options so call sites can read intent.
//   - output:  bipolar (default, ∈ [-amp, amp]) | unipolar (∈ [0, amp]).
//     Unipolar wraps the wave in `*0.5 + 0.5` so the output reads as a
//     normalised brightness, matching how Wave Texture behaves.

import { z } from "zod";

import { withMeta } from "@/shaders/core/schemas";

import { float } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const PROFILES = ["sine", "cosine"] as const;
const OUTPUTS = ["bipolar", "unipolar"] as const;

const PROFILE_LABEL: Record<(typeof PROFILES)[number], string> = {
  sine: "Sine",
  cosine: "Cosine",
};
const OUTPUT_LABEL: Record<(typeof OUTPUTS)[number], string> = {
  bipolar: "Bipolar (−amp…+amp)",
  unipolar: "Unipolar (0…amp)",
};

const config = z.object({
  profile: withMeta(z.enum(PROFILES), { enumLabels: PROFILE_LABEL }).default("sine"),
  output: withMeta(z.enum(OUTPUTS), { enumLabels: OUTPUT_LABEL }).default("bipolar"),
});

type Config = z.infer<typeof config>;

// `freq` defaults to 1 and `amp` to 1 so a fresh node yields a unit oscillator
// across `x`; `t`/`timeFreq`/`phase` default to 0 so time- and phase-free
// usage requires no wiring.
const pinIn = z.object({
  x: float("X", 0),
  t: float("T", 0),
  freq: float("Frequency", 1),
  timeFreq: float("Time Frequency", 0),
  phase: float("Phase", 0),
  amp: float("Amplitude", 1),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Oscillator extends BaseNode<Config, In, Out> {
  static readonly typeId = "oscillator";
  static readonly meta: NodeMeta = {
    name: "Oscillator",
    category: "converter",
    color: "#a78bfa",
    description: "Scalar wave: profile(x·freq + t·timeFreq + phase) · amp.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const o = ctx.outputs.out;
    const fn = c.profile === "cosine" ? "cos" : "sin";
    const wave = `${fn}(${ctx.inputs.x} * ${ctx.inputs.freq} + ${ctx.inputs.t} * ${ctx.inputs.timeFreq} + ${ctx.inputs.phase})`;
    const shaped = c.output === "unipolar" ? `(${wave} * 0.5 + 0.5)` : wave;
    return {
      statements: `float ${o} = ${shaped} * ${ctx.inputs.amp};`,
    };
  }
}

export default register(Oscillator);
