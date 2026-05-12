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
  scale: zFloat(0.1, 64, 0.1).default(5).describe("Scale"),
  brickWidth: zFloat(0.1, 4, 0.01).default(1).describe("Brick Width"),
  rowHeight: zFloat(0.1, 4, 0.01).default(0.5).describe("Row Height"),
  mortarSize: zFloat(0, 0.5, 0.005).default(0.03).describe("Mortar Size"),
  offset: zFloat(0, 1, 0.01).default(0.5).describe("Row Offset"),
  bias: zFloat(-1, 1, 0.01).default(0).describe("Bias"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Brick Texture",
  description: "Running-bond brick tiling with mortar",
  color: "#dc2626",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

// Writes 0 inside mortar, (0,1] inside bricks. Per-brick `bias` modulates the
// fill so each brick reads slightly different, letting a downstream Color
// Ramp 2 stand in for Blender's Color 1 / Color 2 / Mortar split.
export class BrickTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "brick-texture";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    scale: "float",
    brickWidth: "float",
    rowHeight: "float",
    mortarSize: "float",
    offset: "float",
    bias: "float",
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["hash21"],
      main: `
{
  vec2 _bp = p * ${uniforms.scale};
  float _row = floor(_bp.y / ${uniforms.rowHeight});
  float _rowShift = mod(_row, 2.0) * ${uniforms.offset} * ${uniforms.brickWidth};
  float _bx = (_bp.x + _rowShift) / ${uniforms.brickWidth};
  float _col = floor(_bx);
  vec2 _cellLocal = vec2(fract(_bx), fract(_bp.y / ${uniforms.rowHeight}));
  float _mortarX = step(${uniforms.mortarSize}, _cellLocal.x)
                 * step(_cellLocal.x, 1.0 - ${uniforms.mortarSize});
  float _mortarY = step(${uniforms.mortarSize}, _cellLocal.y)
                 * step(_cellLocal.y, 1.0 - ${uniforms.mortarSize});
  float _inBrick = _mortarX * _mortarY;
  float _rand = hash21(vec2(_col, _row));
  float _fill = clamp(0.5 + ${uniforms.bias} * (_rand - 0.5) * 2.0 + (_rand - 0.5) * 0.5, 0.0, 1.0);
  n = _inBrick * _fill;
}`,
    };
  }
}

register(BrickTexture);
export default BrickTexture;
