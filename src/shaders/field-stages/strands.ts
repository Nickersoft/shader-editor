import { z } from "zod";
import {
  CompositeStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zBool, zColor, zFloat, zInt, zVec2 } from "@/shaders/core/schemas";

const config = z.object({
  speed: zFloat(0, 4, 0.05).default(0.5).describe("Speed"),
  amplitude: zFloat(0, 4, 0.01).default(1).describe("Amplitude"),
  frequency: zFloat(0.1, 12, 0.05).default(1).describe("Frequency"),
  lineCount: zInt(1, 80).default(12).describe("Line Count"),
  lineWidth: zFloat(0, 1).default(0.1).describe("Line Width"),
  waveColor: zColor().default([0.95, 0.79, 0.03]).describe("Wave Color"),
  pinEdges: zBool().default(true).describe("Pin Edges"),
  start: zVec2().default([0, 0.5]).describe("Start"),
  end: zVec2().default([1, 0.5]).describe("End"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Strands",
  description: "Procedural wavy strands — composite stage with layered animation",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

// `pinEdges` is a structural enum (boolean drops `if` branch entirely) and
// `lineCount` is the unrolled loop bound — both fold into the rebuild key so
// codegen can prune dead paths instead of branching per-pixel.
export class Strands extends CompositeStageNode<Config, Inputs> {
  static readonly typeId = "strands";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    speed: "float",
    amplitude: "float",
    frequency: "float",
    lineCount: "int",
    lineWidth: "float",
    waveColor: "vec3",
    start: "vec2",
    end: "vec2",
  };

  variantKey(): string {
    return this.config.pinEdges ? "p1" : "p0";
  }

  glsl({ uniforms, config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    const pin = cfg.pinEdges
      ? `float _stPin = sin(clamp(_stAlong, 0.0, 1.0) * 3.14159);`
      : `float _stPin = 1.0;`;
    return {
      dependencies: ["aastep"],
      main: `
vec2 _stAr = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 _stS = ${uniforms.start} * _stAr;
vec2 _stE = ${uniforms.end} * _stAr;
vec2 _stP = uv * _stAr;
vec2 _stAxis = _stE - _stS;
float _stL = max(length(_stAxis), 1e-4);
vec2 _stDir = _stAxis / _stL;
vec2 _stPerp = vec2(-_stDir.y, _stDir.x);
float _stAlong = dot(_stP - _stS, _stDir) / _stL;
float _stAcross = dot(_stP - _stS, _stPerp);
float _stT = u_time * ${uniforms.speed};
float _stN = float(${uniforms.lineCount});
${pin}
float _stAcc = 0.0;
for (int _stI = 0; _stI < 80; _stI++) {
  if (float(_stI) >= _stN) break;
  float _stFi = float(_stI);
  float _stLk = (_stFi + 0.5) / max(_stN, 1.0) - 0.5;
  float _stWave = sin(_stAlong * 6.2831 * ${uniforms.frequency} + _stT + _stFi * 0.7) * 0.06 * ${uniforms.amplitude} * _stPin;
  float _stLY = _stLk * 0.6 + _stWave;
  float _stD = abs(_stAcross - _stLY);
  _stAcc = max(_stAcc, 1.0 - aastep(${uniforms.lineWidth} * 0.05, _stD));
}
_stage_col = ${uniforms.waveColor};
_stage_a = _stAcc;`,
    };
  }
}

register(Strands);
export default Strands;
