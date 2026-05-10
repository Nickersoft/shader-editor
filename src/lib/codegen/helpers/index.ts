// Aggregate barrel for the helpers folder.
//
// Each thematic file (constants, hash, noise, blend-modes, transform, sdf,
// color, image) declares its helpers as plain `GlslUtilEntry` exports. The
// barrel collects them via `import * as` so the canonical registry is just
// the namespace — adding a new helper means dropping a `const myHelper = {…}`
// into the right file; the type and the runtime map both pick it up
// automatically.

import * as constants from "./constants";
import * as hash from "./hash";
import * as noise from "./noise";
import * as blendModes from "./blend-modes";
import * as transform from "./transform";
import * as sdf from "./sdf";
import * as color from "./color";
import * as image from "./image";
import type { GlslUtilEntry } from "./types";

export type { GlslUtilEntry };

/**
 * Object containing every GLSL helper, keyed by name. The literal-narrowed
 * type lets callers derive a precise `keyof typeof GLSL_HELPERS` union.
 */
const GLSL_HELPERS_LITERAL = {
  ...constants,
  ...hash,
  ...noise,
  ...blendModes,
  ...transform,
  ...sdf,
  ...color,
  ...image,
};

/** String-literal union of every available helper name. */
export type GlslHelperName = keyof typeof GLSL_HELPERS_LITERAL;

/**
 * Cross-file `needs` validation. Every entry's `needs` array — narrowed to a
 * literal tuple by the `helper(...)` builder in each file — must point to a
 * key that exists in `GLSL_HELPERS_LITERAL`. A typo (`'simplex2d'`) makes
 * this assignment fail type-check with a "not assignable to type
 * GlslHelperName" error and a `Did you mean` hint.
 */
const _validate: Record<GlslHelperName, { code: string; needs?: readonly GlslHelperName[] }> =
  GLSL_HELPERS_LITERAL;
void _validate;

/**
 * Public lookup. Typed permissively (`Record<string, ... | undefined>`) so
 * codegen can do `GLSL_HELPERS[someString]?.code` without a cast — the strict
 * `GlslHelperName` union still constrains layer-side `dependencies`.
 */
export const GLSL_HELPERS: Record<string, GlslUtilEntry | undefined> = GLSL_HELPERS_LITERAL;

// Re-export individual helpers for callers that prefer named imports
// (e.g. `import { simplex2D } from '@/lib/codegen/helpers'`). Bundlers can
// drop the rest at build time.
export * from "./constants";
export * from "./hash";
export * from "./noise";
export * from "./blend-modes";
export * from "./transform";
export * from "./sdf";
export * from "./color";
export * from "./image";
