import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import {
  zAngle,
  zCenter,
  zColor,
  zEdges,
  zFloat,
  zVec2,
  zVisibleWhen,
} from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";

// Unified gradient: a single layer that swaps between linear, radial, conic,
// and diamond gradient styles via a `type` enum. UI hides irrelevant fields
// per type, and the on-canvas handles likewise change shape.

const config = z.object({
  type: z.enum(["linear", "radial", "conic", "diamond"]).default("linear").describe("Type"),
  colorA: zColor().default([0.1, 1.0, 0.0]).describe("Color A"),
  colorB: zColor().default([0.0, 0.0, 1.0]).describe("Color B"),

  // Linear-only.
  start: zVisibleWhen(zVec2().default([0, 0.5]), { type: ["linear"] }).describe("Start"),
  end: zVisibleWhen(zVec2().default([1, 0.5]), { type: ["linear"] }).describe("End"),
  edges: zVisibleWhen(zEdges().default("stretch"), { type: ["linear"] }).describe("Edges"),

  // Radial / conic / diamond share a center.
  center: zVisibleWhen(zCenter().default([0.5, 0.5]), {
    type: ["radial", "conic", "diamond"],
  }).describe("Center"),

  // Radial-only.
  radius: zVisibleWhen(zFloat(0, 2, 0.01).default(0.5), { type: ["radial"] }).describe("Radius"),
  aspect: zVisibleWhen(zFloat(0.1, 4, 0.01).default(1), { type: ["radial"] }).describe("Aspect"),

  // Diamond-only.
  size: zVisibleWhen(zFloat(0.05, 2, 0.01).default(0.7), { type: ["diamond"] }).describe("Size"),
  roundness: zVisibleWhen(zFloat(0, 1).default(0), { type: ["diamond"] }).describe("Roundness"),

  // Shared rotation. Linear calls it "Angle", others "Rotation"; same uniform.
  rotation: zVisibleWhen(zAngle().default(0), {
    type: ["linear", "radial", "conic", "diamond"],
  }).describe("Rotation"),

  // Shared repeat (radial/conic/diamond only — linear isn't periodic).
  repeat: zVisibleWhen(zFloat(1, 12, 0.5).default(1), {
    type: ["radial", "conic", "diamond"],
  }).describe("Repeat"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Gradient",
  description: "Linear, radial, conic, or diamond gradient between two colors",
  color: "#f97316",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class Gradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "gradient";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly spatialControls = (cfg: Record<string, unknown>): readonly SpatialControl[] => {
    const type = (cfg.type as Config["type"]) ?? "linear";
    switch (type) {
      case "linear":
        return [
          {
            kind: "segmentVec2",
            from: "start",
            to: "end",
            colorFrom: "colorA",
            colorTo: "colorB",
            label: "Gradient line",
          },
        ];
      case "radial":
        return [
          {
            kind: "radiusVec2",
            center: "center",
            r: "radius",
            color: "colorA",
            label: "Radius",
          },
        ];
      case "conic":
      case "diamond":
        return [
          {
            kind: "pointVec2",
            key: "center",
            color: "colorA",
            label: "Center",
          },
        ];
    }
  };

  structuralKey(): string {
    return `${this.config.type}|${this.config.edges}`;
  }

  glsl(): GlslBlock {
    const colorA = this.uniformName("colorA");
    const colorB = this.uniformName("colorB");
    const rotation = this.uniformName("rotation");
    const type = this.config.type;
    if (type === "linear") {
      const start = this.uniformName("start");
      const end = this.uniformName("end");
      const edges = this.config.edges;
      let edgeBlock: string;
      switch (edges) {
        case "stretch":
          edgeBlock = `t = clamp(t, 0.0, 1.0);`;
          break;
        case "transparent":
          edgeBlock = `if (t < 0.0 || t > 1.0) return vec4(0.0);`;
          break;
        case "mirror":
          edgeBlock = `float _m = mod(abs(t), 2.0); t = (_m > 1.0) ? (2.0 - _m) : _m;`;
          break;
        case "wrap":
          edgeBlock = `t = fract(t);`;
          break;
      }
      return {
        dependencies: ["rotate2D"],
        main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 s = ${start} * _ar;
vec2 e = ${end} * _ar;
vec2 p = uv * _ar;
vec2 dir = e - s;
float L = max(length(dir), 1e-4);
vec2 nDir = dir / L;
nDir = rotate2D(nDir, ${rotation} * 3.14159 / 180.0);
float t = dot(p - s, nDir) / L;
${edgeBlock}
vec3 col = mix(${colorA}, ${colorB}, t);
return vec4(col, 1.0);`,
      };
    }
    if (type === "radial") {
      const center = this.uniformName("center");
      const radius = this.uniformName("radius");
      const repeat = this.uniformName("repeat");
      const aspect = this.uniformName("aspect");
      return {
        dependencies: ["rotate2D"],
        main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
p.x /= max(${aspect}, 1e-4);
float r = length(p) / max(${radius}, 1e-4);
float t = fract(r * ${repeat});
float k = 0.5 - 0.5 * cos(t * 6.28318530);
vec3 col = mix(${colorA}, ${colorB}, k);
return vec4(col, 1.0);`,
      };
    }
    if (type === "conic") {
      const center = this.uniformName("center");
      const repeat = this.uniformName("repeat");
      return {
        main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
float a = atan(p.y, p.x) + 3.14159265;
float t = fract((a / 6.28318530 + ${rotation} / 360.0) * ${repeat});
vec3 col = mix(${colorA}, ${colorB}, t);
return vec4(col, 1.0);`,
      };
    }
    // diamond
    const center = this.uniformName("center");
    const size = this.uniformName("size");
    const repeat = this.uniformName("repeat");
    const roundness = this.uniformName("roundness");
    return {
      dependencies: ["rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
float manhattan = abs(p.x) + abs(p.y);
float chebyshev = max(abs(p.x), abs(p.y)) * 2.0;
float d = mix(manhattan, chebyshev, ${roundness}) / max(${size}, 1e-4);
float t = fract(d * ${repeat});
float k = 0.5 - 0.5 * cos(t * 6.28318530);
vec3 col = mix(${colorA}, ${colorB}, k);
return vec4(col, 1.0);`,
    };
  }
}

register(Gradient);
export default Gradient;
