import { z } from "zod";
import {
  FieldStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslHelperName, NodeMeta } from "@/shaders/core/types";
import { zFloat } from "@/shaders/core/schemas";

const config = z.object({
  feature: z.enum(["f1", "f2", "smooth-f1", "distance-to-edge"]).default("f1").describe("Feature"),
  metric: z.enum(["euclidean", "manhattan", "chebychev"]).default("euclidean").describe("Distance"),
  randomness: zFloat(0, 1, 0.01).default(1).describe("Randomness"),
  smoothness: zFloat(0, 1, 0.01).default(0.25).describe("Smoothness"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Voronoi Texture",
  description: "Cellular pattern with Feature / Distance / Randomness",
  color: "#06b6d4",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

// typeId stays `voronoi-sample` so saved scenes hydrate unchanged; the
// displayed name is "Voronoi Texture".
export class VoronoiTexture extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "voronoi-sample";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
    randomness: "float",
    smoothness: "float",
  };

  glsl({ uniforms, config: cfg }: FieldStageContext<Config>): FieldStageGlsl {
    let distExpr: string;
    switch (cfg.metric) {
      case "manhattan":
        distExpr = `(abs(_dv.x) + abs(_dv.y))`;
        break;
      case "chebychev":
        distExpr = `max(abs(_dv.x), abs(_dv.y))`;
        break;
      case "euclidean":
      default:
        distExpr = `length(_dv)`;
        break;
    }

    const needsD2 = cfg.feature === "f2" || cfg.feature === "distance-to-edge";
    const needsSmin = cfg.feature === "smooth-f1";

    let featureWrite: string;
    switch (cfg.feature) {
      case "f2":
        featureWrite = `n = clamp(_d2, 0.0, 1.0);`;
        break;
      case "smooth-f1":
        featureWrite = `n = clamp(_sm, 0.0, 1.0);`;
        break;
      case "distance-to-edge":
        featureWrite = `n = clamp(1.0 - (_d2 - _d1) * 0.5, 0.0, 1.0);`;
        break;
      case "f1":
      default:
        featureWrite = `n = clamp(_d1, 0.0, 1.0);`;
        break;
    }

    const d2Decl = needsD2 ? `float _d2 = 10.0;` : ``;
    const sminDecl = needsSmin
      ? `float _sm = 10.0;
  float _k = max(${uniforms.smoothness}, 1e-4);`
      : ``;
    const sminUpdate = needsSmin ? `\n      _sm = smin(_sm, _d, _k);` : ``;
    const d2Update = needsD2
      ? `if (_d < _d1) { _d2 = _d1; _d1 = _d; } else if (_d < _d2) { _d2 = _d; }`
      : `_d1 = min(_d1, _d);`;

    const deps: GlslHelperName[] = ["hash22"];
    if (needsSmin) deps.push("smin");

    return {
      dependencies: deps,
      main: `
{
  vec2 _cell = floor(p);
  vec2 _local = fract(p);
  float _d1 = 10.0;
  ${d2Decl}
  ${sminDecl}
  for (int _ny = -1; _ny <= 1; _ny++) {
    for (int _nx = -1; _nx <= 1; _nx++) {
      vec2 _off = vec2(float(_nx), float(_ny));
      vec2 _h = hash22(_cell + _off);
      vec2 _ptOff = mix(vec2(0.5), _h, ${uniforms.randomness});
      _ptOff.x = clamp(_ptOff.x + sin(t + _h.x * 6.28) * 0.15 * ${uniforms.randomness}, 0.0, 1.0);
      _ptOff.y = clamp(_ptOff.y + cos(t * 0.7 + _h.y * 6.28) * 0.15 * ${uniforms.randomness}, 0.0, 1.0);
      vec2 _dv = _local - (_off + _ptOff);
      float _d = ${distExpr};${sminUpdate}
      ${d2Update}
    }
  }
  ${featureWrite}
}`,
    };
  }
}

register(VoronoiTexture);
export default VoronoiTexture;
