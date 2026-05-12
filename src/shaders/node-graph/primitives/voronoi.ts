// Voronoi — F1 distance + cell id over a hashed point-jitter grid.
//
// Each integer cell of `p * scale` contributes a randomly placed point
// (deterministic in `seed`); the output is the distance to the nearest point
// (`out`) plus the hash of the owning cell (`id`). The legacy field-stage
// supports F2, smooth-min, and multiple distance metrics — we keep this Phase
// 2 inventory primitive lean; downstream graphs that need those variants can
// either compose with MapRange / Combine, or wait for a richer variant in
// Phase 4.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 200).default(4),
  seed: zFloat(-1000, 1000).default(0),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [
  { id: "out", type: "float", label: "Distance" },
  { id: "id", type: "float", label: "Cell ID" },
];

export default registerPrimitive({
  typeId: "voronoi",
  name: "Voronoi",
  category: "sources",
  color: "#f97316",
  description: "Cellular noise — distance to nearest point + cell id.",
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
      { nameSuffix: "scale", type: "float", value: c.scale } satisfies UniformSpec,
      { nameSuffix: "seed", type: "float", value: c.seed } satisfies UniformSpec,
    ];
  },

  emit(ctx) {
    ctx.addDependency("hash22");
    const p = ctx.inputs.p;
    const scale = ctx.uniforms.scale;
    const seed = ctx.uniforms.seed;
    const out = ctx.outputs.out;
    const id = ctx.outputs.id;
    return {
      statements: `vec2 ${out}_sp = ${p} * ${scale} + vec2(${seed}, ${seed} * 1.31);
vec2 ${out}_cell = floor(${out}_sp);
vec2 ${out}_local = fract(${out}_sp);
float ${out} = 10.0;
vec2 ${out}_winner = vec2(0.0);
for (int _vy = -1; _vy <= 1; _vy++) {
  for (int _vx = -1; _vx <= 1; _vx++) {
    vec2 _voff = vec2(float(_vx), float(_vy));
    vec2 _vh = hash22(${out}_cell + _voff);
    vec2 _vd = (_voff + _vh) - ${out}_local;
    float _vdist = length(_vd);
    if (_vdist < ${out}) {
      ${out} = _vdist;
      ${out}_winner = ${out}_cell + _voff;
    }
  }
}
${out} = clamp(${out}, 0.0, 1.0);
float ${id} = fract(sin(dot(${out}_winner, vec2(127.1, 311.7))) * 43758.5453);`,
    };
  },
});
