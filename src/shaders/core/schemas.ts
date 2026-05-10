// Zod schema helpers + UI metadata.
//
// In the new architecture each Node class declares a `static config: ZodType`
// and `static inputs: ZodType`. These schemas are the single source of truth
// for: runtime validation, TS types (via `z.infer`), property-panel rendering,
// deserialization, and uniform-name generation.
//
// Zod 4 has native `.meta({...})`, but `.default()` / `.optional()` /
// `.nullable()` wrappers don't propagate metadata to the outer schema. So
// helpers here attach meta to the base schema; callers may chain `.default(...)`
// on top, and `getMetaDeep()` walks the wrapper chain to find it.

import { z } from "zod";

export interface UiMeta {
  // Slider/input bounds for numeric scalars.
  ui?: {
    min?: number;
    max?: number;
    step?: number;
    // Renders a color picker for vec3/vec4 tuples instead of three sliders.
    color?: boolean;
    array?: { minLength?: number; maxLength?: number };
    /**
     * Hide this field in the property panel unless the listed sibling-field
     * values match the current config — e.g. `{ type: ['linear'] }` on a
     * gradient's `start` field will only show it when `config.type === 'linear'`.
     */
    visibleWhen?: Record<string, readonly (string | number | boolean)[]>;
    /**
     * Group key for the property panel. Fields sharing a group render under one
     * section header. Reserved values: `'transform'` (rendered first as the
     * universal Transform group on shape primitives).
     */
    group?: string;
  };
  // Tagged kinds the codegen and UI dispatch on. `image-input` and `sampler2D`
  // both refer to image data; the difference is where they live:
  //   - `image-input` lives on `Node.inputs` (chain-typed input). For
  //     GeneratorNode/EffectNode it still binds as a sampler2D; for
  //     ProcessingNode it's passed into `preprocess()` as resolved data.
  //   - `sampler2D` lives on `Node.config` for primitives that just want a
  //     plain texture-uniform without semantic input typing. Rare; prefer
  //     `image-input` on `Node.inputs`.
  kind?: "image-input" | "palette" | "sampler2D";
}

/**
 * Attach UI metadata to a Zod schema. Thin wrapper over Zod 4's native
 * `.meta()` that types the metadata bag as `UiMeta`.
 */
export function withMeta<S extends z.ZodTypeAny>(schema: S, meta: UiMeta): S {
  // Merge with any existing metadata so chained calls compose.
  const existing = (schema.meta() as UiMeta | undefined) ?? {};
  return schema.meta({
    ...existing,
    ...meta,
    ui: { ...existing.ui, ...meta.ui },
  }) as S;
}

/**
 * If `schema` is a Zod 4 wrapper (`.optional()`, `.default(...)`, etc.),
 * return its inner schema; otherwise return undefined. Canonical wrapper
 * traversal primitive — used by `getMetaDeep` and the codegen `unwrap`.
 */
export function tryUnwrap(schema: z.ZodType): z.ZodType | undefined {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodPrefault ||
    schema instanceof z.ZodNonOptional ||
    schema instanceof z.ZodReadonly ||
    schema instanceof z.ZodCatch
  ) {
    return schema.unwrap() as z.ZodType;
  }
  return undefined;
}

const metaCache = new WeakMap<z.ZodType, UiMeta | undefined>();

/**
 * Walks `.optional()` / `.default()` / `.nullable()` wrappers and merges
 * metadata from every level of the chain. Outer-layer metadata wins on
 * conflicts (so a primitive can `.describe('Override')` over a helper's label
 * without losing the inner `kind`).
 *
 * Necessary because Zod 4's wrappers don't propagate `.meta()` outward, *and*
 * because `.describe()` writes to the outer wrapper's own meta — which would
 * otherwise hide a base-schema `kind` like `'palette'` or `'image-input'`.
 *
 * Results are cached per-schema in a WeakMap. Schemas are referentially
 * stable (declared as `static config` / `static inputs` on Node classes), so
 * this turns repeat calls during property-panel renders into O(1) lookups.
 */
export function getMetaDeep(schema: z.ZodType): UiMeta | undefined {
  if (metaCache.has(schema)) return metaCache.get(schema);

  const chain: UiMeta[] = [];
  let s: z.ZodType | undefined = schema;
  while (s) {
    const m = s.meta() as UiMeta | undefined;
    if (m) chain.push(m);
    s = tryUnwrap(s);
  }

  let out: UiMeta | undefined;
  if (chain.length > 0) {
    // Merge inner→outer so outer overrides win on conflicts. UI bag is also
    // merged across levels.
    out = {};
    for (let i = chain.length - 1; i >= 0; i--) {
      const layer = chain[i];
      out = { ...out, ...layer, ui: { ...out.ui, ...layer.ui } };
    }
  }
  metaCache.set(schema, out);
  return out;
}

// === Numeric scalars ===

export function zFloat(min: number, max: number, step = 0.01) {
  return withMeta(z.number().min(min).max(max), { ui: { min, max, step } });
}

export function zInt(min: number, max: number) {
  return withMeta(z.number().int().min(min).max(max), {
    ui: { min, max, step: 1 },
  });
}

export function zAngle(step = 1) {
  return withMeta(z.number(), { ui: { min: 0, max: 360, step } });
}

export function zBool() {
  return z.boolean();
}

/**
 * Mark a schema as conditionally visible based on sibling field values. Used
 * by the property panel to hide irrelevant fields (e.g. on a unified Gradient
 * node, hide `radius` unless `type === 'radial'`).
 */
export function zVisibleWhen<S extends z.ZodTypeAny>(
  schema: S,
  conditions: Record<string, readonly (string | number | boolean)[]>,
): S {
  return withMeta(schema, { ui: { visibleWhen: conditions } });
}

// === Vectors / colors ===

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export function zVec2(min?: number, max?: number, step = 0.01) {
  const ui =
    min !== undefined && max !== undefined ? { min, max, step } : { step };
  return withMeta(z.tuple([z.number(), z.number()]), { ui });
}

/**
 * vec2 in UV space for a "center"/"origin"/"position" control. Range is
 * symmetric around 0 so origins can sit off-screen (e.g. godray sun, lens
 * flare just out of frame). Canvas itself spans 0..1; a default extent of 1
 * gives one canvas-width of off-screen reach in every direction.
 */
export function zCenter(extent = 1, step = 0.01) {
  return zVec2(-extent, extent, step);
}

/** Single-axis counterpart to `zCenter` for `centerX`/`centerY` style configs. */
export function zCenterAxis(extent = 1, step = 0.01) {
  return zFloat(-extent, extent, step);
}

/**
 * The five fields that make up a shape's universal Transform: position
 * (`x`/`y`), bounding-box extent (`width`/`height`), and `rotation`. Spread
 * into a shape's `z.object({...})` so every shape exposes the same Figma-style
 * bounding-box transform, with shape-specific config fields appearing
 * alongside.
 *
 *   const config = z.object({
 *     ...transformFields(),
 *     sides: zInt(3, 16).default(6),
 *     ...
 *   })
 *
 * `width` / `height` are in y-relative units (1.0 spans one canvas height).
 * Range allows >1 so wide shapes can extend past the canvas; ≤2 keeps the
 * slider scale sane while still reaching the corners on portrait canvases.
 */
export function transformFields() {
  return {
    x: withMeta(zCenterAxis(1, 0.001).default(0.5).describe("X"), {
      ui: { group: "transform" },
    }),
    y: withMeta(zCenterAxis(1, 0.001).default(0.5).describe("Y"), {
      ui: { group: "transform" },
    }),
    width: withMeta(zFloat(0.001, 2, 0.001).default(0.5).describe("Width"), {
      ui: { group: "transform" },
    }),
    height: withMeta(zFloat(0.001, 2, 0.001).default(0.5).describe("Height"), {
      ui: { group: "transform" },
    }),
    rotation: withMeta(zAngle(1).default(0).describe("Rotation"), {
      ui: { group: "transform" },
    }),
  };
}

export function zVec3(min?: number, max?: number, step = 0.01) {
  const ui =
    min !== undefined && max !== undefined ? { min, max, step } : { step };
  return withMeta(z.tuple([z.number(), z.number(), z.number()]), { ui });
}

export function zVec4(min?: number, max?: number, step = 0.01) {
  const ui =
    min !== undefined && max !== undefined ? { min, max, step } : { step };
  return withMeta(z.tuple([z.number(), z.number(), z.number(), z.number()]), {
    ui,
  });
}

/** vec3 color in 0..1 with a color-picker UI. */
export function zColor() {
  return withMeta(z.tuple([z.number(), z.number(), z.number()]), {
    ui: { color: true, min: 0, max: 1, step: 0.001 },
  });
}

/** vec4 color (RGBA) in 0..1 with a color-picker UI. */
export function zColorRgba() {
  return withMeta(z.tuple([z.number(), z.number(), z.number(), z.number()]), {
    ui: { color: true, min: 0, max: 1, step: 0.001 },
  });
}

// === Palette (variable-length vec4 array) ===
//
// Generated as `uniform vec4 NAME[arrayLength]` plus `uniform int NAME_count`.
// Palette length defaults to 10; pass a custom max if a primitive needs more.

export const PaletteSchema = z.object({
  values: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])),
  length: z.number().int().min(0),
});
export type Palette = z.infer<typeof PaletteSchema>;

export function zPalette(maxLength = 10) {
  return withMeta(PaletteSchema, {
    kind: "palette",
    ui: { array: { maxLength } },
  });
}

// === Edge handling (mirrors upstream's `edges` enum) ===
//
// Mirrors the four edge modes used by upstream distortion/effect shaders:
// stretch, transparent, mirror, wrap. Stored as a literal string on config,
// branched at codegen time (not as a uniform — enum-string fields aren't
// representable as GLSL uniforms in this system). Use `edgeMode(value)` in a
// node's `glsl()` to get the matching int constant for `applyEdgeHandling`.

export const EdgeModeSchema = z.enum([
  "stretch",
  "transparent",
  "mirror",
  "wrap",
]);
export type EdgeMode = z.infer<typeof EdgeModeSchema>;

export function zEdges() {
  return EdgeModeSchema;
}

export function edgeMode(value: EdgeMode): "0" | "1" | "2" | "3" {
  switch (value) {
    case "stretch":
      return "0";
    case "transparent":
      return "1";
    case "mirror":
      return "2";
    case "wrap":
      return "3";
  }
}

// === Image inputs ===

export const ImageFitSchema = z.enum(["cover", "contain", "fill"]);
export type ImageFit = z.infer<typeof ImageFitSchema>;

export const ImageInputSchema = z.object({
  // null = bind a 1×1 transparent placeholder. Layers should treat as "no image".
  url: z.string().nullable(),
  // 'asset' is reserved for bundled sample images shipped with the editor.
  sourceKind: z.enum(["url", "dataUrl", "asset"]).default("url"),
  // Underlying image aspect, populated by the loader once dimensions are known.
  aspect: z.number().optional(),
  fit: ImageFitSchema.default("contain"),
  offsetX: z.number().default(0),
  offsetY: z.number().default(0),
  scale: z.number().default(1),
  rotation: z.number().default(0),
});
export type ImageInputValue = z.infer<typeof ImageInputSchema>;

/**
 * For typed chain inputs on `Node.inputs`. The codegen + UI both dispatch on
 * the `image-input` kind: GeneratorNode/EffectNode bind it as a sampler2D
 * (with companion meta/offset uniforms); ProcessingNode receives it as
 * resolved data in `preprocess()`.
 */
export function zImageInput() {
  return withMeta(ImageInputSchema, { kind: "image-input" });
}

/**
 * Plain sampler2D uniform on `Node.config`. Use only when a primitive needs a
 * raw texture binding without participating in the typed-input system.
 * Prefer `zImageInput()` on `Node.inputs` for almost all cases.
 */
export function zSampler() {
  return withMeta(ImageInputSchema, { kind: "sampler2D" });
}

// === Helpers for default value construction ===

export const noImage: ImageInputValue = {
  url: null,
  sourceKind: "url",
  fit: "cover",
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
};

export const noImageContain: ImageInputValue = { ...noImage, fit: "contain" };

export function image(
  url: string,
  partial: Partial<ImageInputValue> = {},
): ImageInputValue {
  return { ...noImage, url, ...partial };
}

export function emptyPalette(length = 0): Palette {
  return { values: [], length };
}
