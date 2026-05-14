// Mapping — Blender's "Mapping" node. Transforms a 3D vector by
// location/rotation/scale, with four Blender-canonical modes:
//
//   point:   out = location + rotateEuler(scale * v, rotation)
//   texture: out = scale * (rotateEuler(v - location, -rotation))
//   vector:  out = rotateEuler(scale * v, rotation)             (no location)
//   normal:  out = normalize(rotateEuler(scale * v, rotation))  (no location)
//
// Each of location / rotation / scale is exposed as a `vec3` input pin so
// authors can either set inline defaults or drive the field with another
// node. The Euler rotation uses XYZ order to match Blender.

import { z } from "zod";
import { vec3, vector3 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";
import { withMeta } from "@/shaders/core/schemas";

const MODES = ["point", "texture", "vector", "normal"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABEL: Record<Mode, string> = {
  point: "Point",
  texture: "Texture",
  vector: "Vector",
  normal: "Normal",
};

const config = z.object({
  mode: withMeta(z.enum(MODES), { enumLabels: MODE_LABEL }).default("point"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  vector: vector3("Vector", [0, 0, 0]),
  location: vec3("Location", [0, 0, 0]),
  rotation: vec3("Rotation", [0, 0, 0]),
  scale: vec3("Scale", [1, 1, 1]),
});

const pinOut = z.object({
  out: vector3("Vector"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class Mapping extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "mapping";
  static readonly meta: PrimitiveMeta = {
    name: "Mapping",
    category: "vector",
    color: "#a78bfa",
    description: "Transform a vector by location, rotation, and scale (Blender's Mapping node).",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("rotateEulerXYZ");
    const mode = this.cfg(ctx.config).mode;
    const v = ctx.inputs.vector;
    const loc = ctx.inputs.location;
    const rot = ctx.inputs.rotation;
    const scl = ctx.inputs.scale;
    const o = ctx.outputs.out;

    switch (mode) {
      case "point":
        return {
          statements: `vec3 ${o} = ${loc} + rotateEulerXYZ(${rot}) * (${scl} * ${v});`,
        };
      case "texture":
        // Inverse: subtract location then rotate by negative angles, then
        // scale. This matches Blender's Texture mapping which inverts the
        // transform so a texture authored in the +scale +rotation space lands
        // in the right place.
        return {
          statements: `vec3 ${o} = ${scl} * (rotateEulerXYZ(-${rot}) * (${v} - ${loc}));`,
        };
      case "vector":
        return {
          statements: `vec3 ${o} = rotateEulerXYZ(${rot}) * (${scl} * ${v});`,
        };
      case "normal":
        return {
          statements: `vec3 ${o}_unn = rotateEulerXYZ(${rot}) * (${scl} * ${v});
vec3 ${o} = (length(${o}_unn) > 1e-6) ? normalize(${o}_unn) : vec3(0.0);`,
        };
    }
  }
}

export default register(Mapping);
