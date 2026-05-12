import { z } from "zod";
import {
  CompositeStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { zAngle, zColor, zFloat } from "@/shaders/core/schemas";

const config = z.object({
  colorA: zColor().default([1, 1, 1]).describe("Color A"),
  colorB: zColor().default([1, 1, 1]).describe("Color B"),
  angle: zAngle(1).default(90).describe("Angle"),
  speed: zFloat(0, 4, 0.05).default(0.5).describe("Speed"),
  speedVariance: zFloat(0, 1).default(0.3).describe("Speed Variance"),
  density: zFloat(2, 100, 1).default(15).describe("Density"),
  trailLength: zFloat(0, 1).default(0.35).describe("Trail Length"),
  balance: zFloat(0, 1).default(0.5).describe("Balance"),
  strokeWidth: zFloat(0, 1).default(0.15).describe("Stroke Width"),
  rounding: zFloat(0, 1).default(1).describe("Rounding"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Falling Lines",
  description: "Directional falling streaks — composite stage with leading→trailing fade",
  color: "#0ea5e9",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class FallingLines extends CompositeStageNode<Config, Inputs> {
  static readonly typeId = "falling-lines";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    colorA: "vec3",
    colorB: "vec3",
    angle: "float",
    speed: "float",
    speedVariance: "float",
    density: "float",
    trailLength: "float",
    balance: "float",
    strokeWidth: "float",
    rounding: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["hash21", "rotate2D"],
      main: `
vec2 _flAr = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 _flP = (uv - 0.5) * _flAr;
_flP = rotate2D(_flP, -(${uniforms.angle} - 90.0) * 3.14159265 / 180.0);
float _flDens = ${uniforms.density};
float _flColId = floor(_flP.x * _flDens);
float _flJit = hash21(vec2(_flColId, 7.0));
float _flJSpd = mix(1.0 - ${uniforms.speedVariance}, 1.0 + ${uniforms.speedVariance}, _flJit);
float _flYOff = u_time * ${uniforms.speed} * 0.6 * _flJSpd + _flJit * 9.7;
float _flSpacing = max(${uniforms.trailLength} * 1.6, 0.05);
float _flLane = fract(_flP.y + _flYOff) / _flSpacing;
float _flAlong = clamp(_flLane, 0.0, 1.0);
float _flOn = step(_flLane, 1.0);
float _flXLoc = (fract(_flP.x * _flDens) - 0.5) * 2.0;
float _flHalfW = clamp(${uniforms.strokeWidth}, 0.001, 1.0);
float _flStroke = 1.0 - smoothstep(_flHalfW * 0.95, _flHalfW, abs(_flXLoc));
float _flCap = 1.0 - smoothstep(0.95, 1.0, _flAlong);
float _flRcap = mix(1.0, _flCap, ${uniforms.rounding});
float _flMask = _flStroke * _flOn * _flRcap;
float _flT = clamp(_flAlong + (${uniforms.balance} - 0.5), 0.0, 1.0);
_stage_col = mix(${uniforms.colorA}, ${uniforms.colorB}, _flT);
_stage_a = _flMask;`,
    };
  }
}

register(FallingLines);
export default FallingLines;
