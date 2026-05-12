import { z } from "zod";
import {
  CompositeStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zCenter, zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  center: zCenter().default([0.5, 0.5]).describe("Center"),
  colorA: zColor().default([1.0, 0.42, 0.21]).describe("Color A"),
  colorB: zColor().default([0.91, 0.12, 0.39]).describe("Color B"),
  size: zFloat(0, 1).default(0.5).describe("Size"),
  deformation: zFloat(0, 1).default(0.5).describe("Deformation"),
  softness: zFloat(0, 1).default(0.5).describe("Softness"),
  highlightIntensity: zFloat(0, 1).default(0.5).describe("Highlight Intensity"),
  highlightX: zFloat(-1, 1).default(0.3).describe("Highlight X"),
  highlightY: zFloat(-1, 1).default(-0.3).describe("Highlight Y"),
  highlightZ: zFloat(0, 1).default(0.4).describe("Highlight Z"),
  highlightColor: zColor().default([1.0, 0.88, 0.1]).describe("Highlight Color"),
  speed: zFloat(0, 4, 0.05).default(0.5).describe("Speed"),
  seed: zFloat(0, 100, 0.1).default(1).describe("Seed"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Blob",
  description: "Animated organic blob — composite stage with mask + highlight",
  color: "#ff6b35",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Blob extends CompositeStageNode<Config, Inputs> {
  static readonly typeId = "blob";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    center: "vec2",
    colorA: "vec3",
    colorB: "vec3",
    size: "float",
    deformation: "float",
    softness: "float",
    highlightIntensity: "float",
    highlightX: "float",
    highlightY: "float",
    highlightZ: "float",
    highlightColor: "vec3",
    speed: "float",
    seed: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["fbm", "simplex2D"],
      main: `
vec2 _blAr = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 _blP = (uv - ${uniforms.center}) * _blAr;
float _blT = u_time * ${uniforms.speed};
float _blR0 = ${uniforms.size} * 0.45 + 0.05;
float _blAng = atan(_blP.y, _blP.x);
float _blDef = ${uniforms.deformation};
float _blWarp = 0.0;
_blWarp += sin(_blAng * 3.0 + _blT * 0.7 + ${uniforms.seed}) * 0.18;
_blWarp += sin(_blAng * 5.0 - _blT * 1.1 + ${uniforms.seed} * 1.7) * 0.10;
_blWarp += fbm(vec2(cos(_blAng), sin(_blAng)) * 2.0 + _blT * 0.2 + ${uniforms.seed}, 3.0, 2.0, 0.5) * 0.25;
float _blRad = _blR0 * (1.0 + _blWarp * _blDef);
float _blD = length(_blP) - _blRad;
float _blEdge = mix(0.005, 0.20, ${uniforms.softness});
float _blMask = 1.0 - smoothstep(-_blEdge, _blEdge, _blD);
float _blFill = clamp(length(_blP) / max(_blRad, 1e-4), 0.0, 1.0);
vec3 _blBg = mix(${uniforms.colorA}, ${uniforms.colorB}, _blFill);
float _blInside = clamp(-_blD / max(_blRad, 1e-4), 0.0, 1.0);
float _blH = sqrt(max(_blInside, 0.0));
vec2 _blGrad = vec2(dFdx(_blD), dFdy(_blD));
vec3 _blN = normalize(vec3(-_blGrad * 4.0, max(_blH, 0.001)));
vec3 _blL = normalize(vec3(${uniforms.highlightX}, ${uniforms.highlightY}, max(${uniforms.highlightZ}, 0.05)));
float _blSpec = pow(max(dot(_blN, _blL), 0.0), 24.0);
vec3 _blHi = ${uniforms.highlightColor} * _blSpec * ${uniforms.highlightIntensity} * 1.6;
_stage_col = _blBg + _blHi * _blMask;
_stage_a = _blMask;`,
    };
  }
}

register(Blob);
export default Blob;
