// Shared type for every GLSL helper entry.
//
// Each helper file under this folder exports one or more `GlslUtilEntry`
// values. `needs` is typed loosely (`readonly string[]`) per file; the barrel
// (`./index`) performs a single cross-file `satisfies`-style validation that
// constrains every `needs` to real helper names.

export interface GlslUtilEntry {
  /** GLSL source spliced into a fragment shader at file scope when this helper
   *  is referenced (directly or transitively) by an enabled node. */
  code: string;
  /** Other helpers this one calls. Codegen walks them transitively so callers
   *  only need to declare the helpers they directly reference. */
  needs?: readonly string[];
}

/**
 * Identity helper that narrows a helper entry's `needs` array to a literal
 * tuple via `<const N>`. Use this in each helper file in place of a `:
 * GlslUtilEntry` annotation:
 *
 *   export const fbm = helper({ code: `...`, needs: ['simplex2D'] })
 *
 * The literal narrowing lets the barrel cross-validate `needs` against the
 * full set of helper names — a typo in `needs` becomes a compile-time error.
 */
export function helper<const N extends readonly string[] = readonly []>(t: {
  code: string;
  needs?: N;
}): { code: string; needs?: N } {
  return t;
}
