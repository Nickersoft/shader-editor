// BrickTexture — running-bond brick courses with hash-driven shade variation.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({
  scale: zFloat(0.1, 200, 0.1).default(4),
  rowHeight: zFloat(0.05, 2, 0.01).default(0.5),
  brickWidth: zFloat(0.05, 4, 0.01).default(1),
  offset: zFloat(0, 1, 0.01).default(0.5),
  mortarSize: zFloat(0, 0.5, 0.01).default(0.05),
  bias: zFloat(0, 1, 0.01).default(0.5),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class BrickTexture extends BaseNode<Config, In, Out> {
  static readonly typeId = "brick-texture";
  static readonly meta: NodeMeta = {
    name: "Brick Texture",
    category: "texture",
    color: "#b45309",
    description: "Running-bond brick courses.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  static readonly uniformKeys = {
    scale: "float",
    rowHeight: "float",
    brickWidth: "float",
    offset: "float",
    mortarSize: "float",
    bias: "float",
  } as const;

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("hash21");
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_bp = ${p} * ${u.scale};
float ${o}_row = floor(${o}_bp.y / ${u.rowHeight});
float ${o}_rs = mod(${o}_row, 2.0) * ${u.offset} * ${u.brickWidth};
float ${o}_bx = (${o}_bp.x + ${o}_rs) / ${u.brickWidth};
float ${o}_col = floor(${o}_bx);
vec2 ${o}_cl = vec2(fract(${o}_bx), fract(${o}_bp.y / ${u.rowHeight}));
float ${o}_mx = step(${u.mortarSize}, ${o}_cl.x) * step(${o}_cl.x, 1.0 - ${u.mortarSize});
float ${o}_my = step(${u.mortarSize}, ${o}_cl.y) * step(${o}_cl.y, 1.0 - ${u.mortarSize});
float ${o}_in = ${o}_mx * ${o}_my;
float ${o}_r = hash21(vec2(${o}_col, ${o}_row));
float ${o}_fill = clamp(0.5 + ${u.bias} * (${o}_r - 0.5) * 2.0 + (${o}_r - 0.5) * 0.5, 0.0, 1.0);
float ${o} = ${o}_in * ${o}_fill;`,
    };
  }
}

export default register(BrickTexture);
