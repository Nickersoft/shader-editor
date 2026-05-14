import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { transformFields, zColor, zFloat } from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";

const config = z.object({
  strokeMode: z.enum(["inside", "center", "outside"]).default("center").describe("Stroke Mode"),
});

const uniforms = z.object({
  ...transformFields(),
  thickness: zFloat(0, 1, 0.001).default(0.2).describe("Thickness"),
  innerShape: zFloat(0, 1, 0.01).default(0).describe("Inner Falloff"),
  fillColor: zColor().default([1, 1, 1]).describe("Fill"),
  strokeColor: zColor().default([0, 0, 0]).describe("Stroke"),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe("Stroke Width"),
});

const meta: NodeMeta = {
  name: "Ring",
  description: "Annular ring with adjustable thickness — fills its bounding box",
  color: "#3b82f6",
  category: "shapes",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export class Ring extends GeneratorNode<Config, Uniforms> {
  static readonly typeId = "ring";
  static readonly config = config;
  static readonly uniforms = uniforms;
  static readonly meta = meta;
  static readonly spatialControls: readonly SpatialControl[] = [
    {
      kind: "transform",
      x: "x",
      y: "y",
      w: "width",
      h: "height",
      rotation: "rotation",
      label: "Bounds",
    },
  ];

  structuralKey(): string {
    // Default would hash `config` (just `strokeMode`), but the soft-falloff
    // path is gated on a uniform-side threshold (`innerShape > 0`) that flips
    // which smoothsteps the shader emits — so we fold it in too.
    const soft = this.uniforms.innerShape > 0 ? "soft" : "crisp";
    return `${soft}|${this.config.strokeMode}`;
  }

  glsl(): GlslBlock {
    const x = this.uniformName("x");
    const y = this.uniformName("y");
    const w = this.uniformName("width");
    const h = this.uniformName("height");
    const rot = this.uniformName("rotation");
    const th = this.uniformName("thickness");
    const innerShape = this.uniformName("innerShape");
    const fill = this.uniformName("fillColor");
    const stroke = this.uniformName("strokeColor");
    const sw = this.uniformName("strokeWidth");
    const offset =
      this.config.strokeMode === "inside"
        ? `(-${sw} * 0.5)`
        : this.config.strokeMode === "outside"
          ? `(${sw} * 0.5)`
          : `0.0`;

    // Outer boundary in pn-space sits at length(pn)=1; band centre tracks
    // the (0.5 → 1.0) midpoint pulled inward by the thickness ratio. World-
    // space distances are reconstituted via the smaller half-extent for
    // stroke fidelity.
    const useSoft = this.uniforms.innerShape > 0;
    const fillABody = useSoft
      ? `
// Soft-falloff ring: smooth alpha bump fading inward from the outer boundary.
float outer = 1.0 - smoothstep(0.0, ${th}, distOut);
float inner = smoothstep(-pow(${innerShape}, 3.0) * ${th}, 0.0, distOut);
float fillA = outer * inner;`
      : `
// Crisp band: alpha 1 inside [-thickness, 0] in unit-bbox space, ~1px feather.
float d = abs(distOut + ${th} * 0.5) - ${th} * 0.5;
float fillA = 1.0 - aastep(0.0, d);`;

    return {
      dependencies: ["aastep", "sdCircle", "rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float distOut = sdCircle(pn, 1.0);
${fillABody}
// Stroke tracks the band-centre line so it stays recognisable across modes.
float strokeD = (abs(distOut + ${th} * 0.5) - ${th} * 0.5) * refHalf;
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(strokeD - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    };
  }
}

register(Ring);
export default Ring;
