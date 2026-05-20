// ColorRamp — N-stop colour gradient driven by a scalar `t ∈ [0, 1]`.
//
// Stops are ordered by their `position`. Adjacent stops are linearly mixed;
// `t` outside the configured range clamps to the nearest endpoint. The legacy
// 4-stop ramp (`color-ramp-4`) is exactly this primitive with positions at
// `[0, 1/3, 2/3, 1]`.
//
// Implementation note: each colour stop becomes its own uniform so the user
// can edit individual stops without recompiling the shader. The number of
// stops *is* structural — the emitted GLSL has a fixed if/else chain — so
// adding/removing a stop triggers a rebuild (handled automatically because
// the stops array's length contributes to `structuralKey`).

import { z } from "zod";
import { zFloat, zVec3 } from "@/shaders/core/schemas";
import { color, float } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
  type UniformSpec,
} from "../registry";
import type { GraphNode } from "../types";

const stopSchema = z.object({
  position: zFloat(0, 1).default(0),
  color: zVec3().default([0, 0, 0]),
});

const config = z.object({
  stops: z
    .array(stopSchema)
    .min(2)
    .default([
      { position: 0, color: [0, 0, 0] },
      { position: 1, color: [1, 1, 1] },
    ]),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  t: float("Factor", 0),
});

const pinOut = z.object({
  out: color("Color"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class ColorRamp extends BaseNode<Config, In, Out> {
  static readonly typeId = "color-ramp";
  static readonly meta: NodeMeta = {
    name: "Color Ramp",
    category: "color",
    color: "#ec4899",
    description: "N-stop colour gradient driven by a scalar.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    const specs: UniformSpec[] = [];
    c.stops.forEach((stop, i) => {
      specs.push({
        nameSuffix: `c${i}`,
        type: "vec3",
        value: stop.color,
        valuePath: ["stops", String(i), "color"],
      });
      specs.push({
        nameSuffix: `p${i}`,
        type: "float",
        value: stop.position,
        valuePath: ["stops", String(i), "position"],
      });
    });
    return specs;
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const n = c.stops.length;
    // Build a piecewise if/else chain over the N−1 segments between adjacent
    // stops. Clamping `t` to the configured range first means callers can pipe
    // any signal in without worrying about boundary glitches.
    const tLocal = `${o}_t`;
    const lines = [
      `float ${tLocal} = clamp(${t}, ${ctx.uniforms.p0}, ${ctx.uniforms[`p${n - 1}`]});`,
      `vec3 ${o};`,
    ];
    // Two-stop fast path — single mix, no branching needed.
    if (n === 2) {
      const cA = ctx.uniforms.c0;
      const cB = ctx.uniforms.c1;
      const pA = ctx.uniforms.p0;
      const pB = ctx.uniforms.p1;
      lines.push(
        `${o} = mix(${cA}, ${cB}, clamp((${tLocal} - ${pA}) / max(${pB} - ${pA}, 1e-6), 0.0, 1.0));`,
      );
      return { statements: lines.join("\n") };
    }
    // Multi-stop: piecewise if/else over the N−1 segments. The last segment
    // becomes a plain `else` so every path assigns `${o}` — relying on the
    // earlier `clamp(t, p0, p_n-1)` to keep us inside the configured range.
    for (let i = 0; i < n - 1; i++) {
      const cA = ctx.uniforms[`c${i}`];
      const cB = ctx.uniforms[`c${i + 1}`];
      const pA = ctx.uniforms[`p${i}`];
      const pB = ctx.uniforms[`p${i + 1}`];
      const head = i === 0 ? "if" : "else if";
      const seg = `mix(${cA}, ${cB}, clamp((${tLocal} - ${pA}) / max(${pB} - ${pA}, 1e-6), 0.0, 1.0))`;
      if (i === n - 2) {
        lines.push(`else { ${o} = ${seg}; }`);
      } else {
        lines.push(`${head} (${tLocal} < ${pB}) { ${o} = ${seg}; }`);
      }
    }
    return { statements: lines.join("\n") };
  }
}

export default register(ColorRamp);
