import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  radialScale: zFloat(0.1, 8, 0.05).default(1).describe("Radial Scale"),
  angularScale: zFloat(0.1, 8, 0.05).default(1).describe("Angular Scale"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Polar Domain",
  description:
    "Converts the coordinate domain from cartesian (x, y) to polar (radius, angle) — unlocks radial patterns when followed by a sampler",
  color: "#a3e635",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class PolarDomain extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "polar-domain";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    radialScale: "float",
    angularScale: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      main: `p = vec2(length(p) * ${uniforms.radialScale}, atan(p.y, p.x) * ${uniforms.angularScale});`,
    };
  }
}

register(PolarDomain);
export default PolarDomain;
