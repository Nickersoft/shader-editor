import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslHelperName, NodeMeta } from "@/shaders/core/types";
import { zFloat, zInt } from "@/shaders/core/schemas";

const config = z.object({
  type: z.enum(["bands", "rings"]).default("bands").describe("Type"),
  profile: z.enum(["sine", "saw", "triangle"]).default("sine").describe("Profile"),
  scale: zFloat(0.1, 32, 0.1).default(5).describe("Scale"),
  distortion: zFloat(0, 8, 0.05).default(0).describe("Distortion"),
  detail: zInt(0, 6).default(2).describe("Detail"),
  phaseOffset: zFloat(0, 6.2832, 0.01).default(0).describe("Phase Offset"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Wave Texture",
  description: "Banded / ringed wave pattern with optional fbm distortion",
  color: "#8b5cf6",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class WaveTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "wave-texture";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    distortion: "float",
    detail: "int",
    phaseOffset: "float",
  };
  // distortion=0 prunes the fbm call entirely; the live uniform compare can't
  // do that, so a slider crossing 0 triggers a one-time rebuild.
  variantKey(): string {
    return this.config.distortion === 0 ? "d0" : "d1";
  }

  glsl({ uniforms, config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    const phaseExpr = cfg.type === "rings" ? `length(_wp)` : `_wp.x`;
    let shapeExpr: string;
    switch (cfg.profile) {
      case "saw":
        shapeExpr = `fract(_phase)`;
        break;
      case "triangle":
        shapeExpr = `abs(2.0 * fract(_phase) - 1.0)`;
        break;
      case "sine":
      default:
        shapeExpr = `0.5 + 0.5 * sin(_phase * TWO_PI)`;
        break;
    }
    const warp =
      cfg.distortion === 0
        ? ""
        : `
  _phase += ${uniforms.distortion} * fbm(_wp, float(${uniforms.detail}) + 1.0, 2.0, 0.5);`;
    const deps: GlslHelperName[] = ["pi"];
    if (cfg.distortion !== 0) {
      deps.push("fbm", "simplex2D");
    }
    return {
      dependencies: deps,
      main: `
{
  vec2 _wp = p * ${uniforms.scale};
  float _phase = ${phaseExpr} + ${uniforms.phaseOffset};${warp}
  n = clamp(${shapeExpr}, 0.0, 1.0);
}`,
    };
  }
}

register(WaveTexture);
export default WaveTexture;
