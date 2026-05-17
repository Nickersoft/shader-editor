# Shader rename migration — actual status & execution plan

> Companion to `docs/shader-rename-unification.md`.
>
> The parent plan describes Sessions 3-4 in past tense; they did not land before this document was written. The atomic Phase B migration described below LANDED in a single commit on 2026-05-17. The historical record of "what was claimed vs. what was true" is preserved here in case the discrepancy recurs.

## Completion (2026-05-17, Phase B)

Atomic single-commit migration. Final typecheck: **18 errors** (down from 35 baseline, all 18 pre-existing and unrelated to the hierarchy migration). Smoke results:
- `bun scripts/smoke-effects.ts` — **62/62 passing**.
- `bun scripts/verify-presets.ts` — **33/34 passing**. Sole failure: `aurora` references retired `aurora-texture` primitive (pre-existing data issue, unrelated).

Foundation commits (Phase A):
- `5c70661` — shader: track foundation hierarchy (unwired)
- Phase B mega commit follows.

## What actually existed on disk before Phase B (2026-05-17)

### Foundation — DONE (untracked, but written)

| File | Status |
|---|---|
| `src/shaders/core/shader.svelte.ts` | ✅ exists, untracked |
| `src/shaders/core/procedural-shader.svelte.ts` | ✅ exists, untracked |
| `src/shaders/core/procedural-effect.svelte.ts` | ✅ exists, untracked |
| `src/shaders/core/graph-shader-helpers.ts` | ✅ exists, untracked |

These four files define the entire `Shader` / `Effect` / `StaticShader` / `StaticEffect` / `ProceduralShader` / `ProceduralEffect` hierarchy but **have zero concrete subclasses** and **are not wired into any consumer**.

### Old hierarchy — STILL PRESENT

| File | Plan claims | Reality |
|---|---|---|
| `src/shaders/core/node.svelte.ts` | deleted | **still exists** |
| `src/shaders/core/graph-effect.svelte.ts` | deleted | **still exists** |
| `src/shaders/textures/procedural-field.svelte.ts` | deleted | **still exists** |
| `src/shaders/textures/procedural-presets.ts` | deleted | **still exists** |
| `src/shaders/textures/preset-graphs/builders.ts` | moved to `node-graph/graph-builder.ts` | **still at original path, no move** |
| 97 files importing `PresetGraphBuilder` | renamed to `GraphBuilder` | **unchanged** |

### Concrete shaders — STILL ON OLD BASE

| Category | Count | Plan claims | Reality |
|---|---|---|---|
| `shapes/` extending `GeneratorNode` | 10 | `StaticShader` | unchanged |
| `interactive/` extending `GeneratorNode` (chroma-flow, smoke) | 2 | `StaticShader` | unchanged |
| `textures/` media extending `GeneratorNode` (image/video/webcam) | 3 | `StaticShader` | unchanged |
| `textures/procedural-field.svelte.ts` | 1 | retired entirely | unchanged |
| **GeneratorNode subclasses total** | **16** | all migrated | **all on `GeneratorNode`** |
| `GraphEffectBase` subclasses (all effect categories) | 62 | `ProceduralEffect` | unchanged |
| `ProceduralPreset` literals in `textures/*.ts` | 35 files | promoted to `ProceduralShader` subclasses | unchanged |

### Consumer surface — STILL ON OLD TYPES

- `src/shaders/core/registry.ts` — `register<Node>`, `deserializeNode`, `getNodeClass`. Plan claims replaced with `register<Shader>`, `deserializeShader`, `getShaderClass`. **Not done.**
- `src/shaders/core/scene.svelte.ts` — types `EffectNode`, `Node`. **Unchanged.**
- `src/shaders/core/layer.svelte.ts` — typed against `Node` / `GeneratorNode`. **Unchanged.**
- `src/lib/state/composer.svelte.ts` — `updateConfig`, `updateUniform`, `addProceduralPresetLayer`. **Unchanged.**
- `src/lib/codegen/{passes,fragment,index,prefix-slugs,scene-passes}.ts` + `runtime/js-layer-runner.ts` — iterate `node.config` / `node.uniforms`. **Unchanged.**
- ~14 property-pane components — read `.config[key]` / `.uniforms[key]`. **Unchanged.**

### Pre-existing typecheck errors (not from this migration)

35 errors in `bun run check`. Likely-related to in-flight work elsewhere:
- `src/shaders/node-graph/primitives/iterate.ts` — references undeclared exports (`ACCUMULATOR_IN_SUFFIX`, `accumulatorInPinId`, `ITERATE_TYPE_ID`, etc.). Looks like a mid-edit primitive.
- `src/components/texture-graph/iterate-accumulator-editor.svelte` — imports the same missing names.
- `src/components/properties/layer/layer-properties.svelte` — malformed template (unbalanced `</div>`).
- `src/components/properties/index.svelte` — references `BLEND_MODES` in code that survived deleting its source.
- `src/components/properties/layer/{layer-blending,layer-opacity}.svelte` — import `Shader` from `@/shaders` (barrel), which doesn't re-export it yet.
- `Layer` is imported from `@/shaders/core/scene.svelte` in 6 files, but the file only declares it locally (no re-export).

**Recommendation:** address these only insofar as they intersect the migration. Most are independent.

## What remains, in execution order

### Phase A — Commit the foundation (low risk, no behavior change)

1. `git add src/shaders/core/shader.svelte.ts src/shaders/core/procedural-shader.svelte.ts src/shaders/core/procedural-effect.svelte.ts src/shaders/core/graph-shader-helpers.ts`
2. Commit as "shader hierarchy foundation (unwired)".
3. **Verification:** `bun run check` — error count unchanged (35).

Rationale: locks in the existing untracked work so a stray `git reset` can't erase it again.

### Phase B — Atomic core swap (the moment of truth)

All in one commit, because the type web breaks otherwise (Session 1 of the parent plan rediscovered this lesson the hard way).

1. **Replace `registry.ts`** — typed on `ShaderClass`, exports `register<Shader>`, `getShaderClass`, `listShaderClasses`, `deserializeShader`. No legacy `deserializeNode` export. ~60 lines.
2. **Rewrite `scene.svelte.ts`** — types `Shader` / `Effect` instead of `Node` / `EffectNode`. Rename `findNode` → `findShader`. Re-export `Layer` (the 6 dependent files currently break on this). ~250 lines.
3. **Rewrite `layer.svelte.ts`** — `source: Shader`, `effects: Effect[]`, deserializes via `deserializeShader`. ~100 lines.
4. **Rewrite `spatial.ts`** — rename `NodeClass` references to `ShaderClass`. ~5 changes.
5. **Move `PresetGraphBuilder`** — `src/shaders/textures/preset-graphs/builders.ts` → `src/shaders/node-graph/graph-builder.ts`. Class `PresetGraphBuilder` → `GraphBuilder`. Re-export from `node-graph` barrel. Delete `preset-graphs/` directory.
6. **Rewrite consumer code:**
   - `src/lib/codegen/passes.ts` — dispatch on `isProcessingShader` / `instanceof Effect` / `isGenerator`.
   - `src/lib/codegen/fragment.ts` — `cls.schema` (single bag), `node.inputs[k]` lookups.
   - `src/lib/codegen/index.ts` — same.
   - `src/lib/codegen/prefix-slugs.ts` — walks `Shader`, imports `sanitizeName` from `shader.svelte.ts`.
   - `src/lib/codegen/runtime/js-layer-runner.ts` — hashes `node.inputs`, retyped to `ProcessingShader`.
   - `src/lib/state/composer.svelte.ts` — `updateInput` / `updateInputBatch` replace `updateConfig` / `updateUniform` / `updateUniformBatch`. Drop `addProceduralPresetLayer`, `separateProceduralPreset`. Replace `instanceof ProceduralField` with `isProceduralShader`.

7. **Migrate all 16 GeneratorNode subclasses to `StaticShader`** — mechanical per file (~5 minutes each):
   - Merge `static config` + `static uniforms` into one `static schema`. Mark previously-config (non-enum) fields with `.meta({ structural: true })`.
   - `extends GeneratorNode<C, U>` → `extends StaticShader<I>`.
   - `this.config.foo` / `this.uniforms.foo` → `this.inputs.foo`.

8. **Migrate all 62 GraphEffectBase subclasses to `ProceduralEffect`** — strictly mechanical:
   - `extends GraphEffectBase` → `extends ProceduralEffect`.
   - `static defaultGraph()` → `static graph()`.
   - Drop `EffectNode` / `GeneratorNode` / `GraphEffectBase` imports; add `ProceduralEffect` import.

9. **Promote 35 `ProceduralPreset` literals to `ProceduralShader` subclasses** — each becomes `class FooPreset extends ProceduralShader { static typeId = "foo"; static meta = ...; static graph() { ... } }` and registers itself. Drop the `ProceduralPreset` interface and `PROCEDURAL_PRESETS` catalog.

10. **Rewrite ~14 property-pane components** — read `node.inputs[k]`, write via `composer.updateInput`. Split fields on `glslType === "enumString"` vs. everything else. The effects palette, layer pickers, etc.

11. **Delete:**
    - `src/shaders/core/node.svelte.ts`
    - `src/shaders/core/graph-effect.svelte.ts`
    - `src/shaders/textures/procedural-field.svelte.ts`
    - `src/shaders/textures/procedural-presets.ts`
    - The legacy `extraUniforms?()` registry slot
    - Now-redundant helpers in `src/shaders/core/schemas.ts`

12. **Verification:**
    - `bun run check` should not regress past 35 errors (ideally drops because several pre-existing errors — `Layer` not exported, `Shader` not in barrel — get fixed in passing).
    - `bun scripts/smoke-effects.ts` — registered effects build without throwing.
    - `bun scripts/verify-presets.ts` — registered procedural shaders build.
    - **Manual browser test** — load the editor (`bun run dev`), pick a few shaders from each category, scrub uniforms, confirm rendering is intact. **This is non-negotiable**; the typecheck won't catch a broken `this.inputs.foo` lookup against the wrong schema key.

Scope: ~110 file edits. Realistic time at careful pace: **8–14 hours of focused work**, almost certainly across multiple sessions.

### Phase C — Cleanups & follow-up (optional)

1. Rewrite the property-panel field renderer (Task 11 in the parent plan) to consume `inspectInputs(cls.schema)` directly off pin-DSL metadata, retiring `inferGlslType` heuristics.
2. Fix the pre-existing errors (`iterate.ts` accumulator API, `layer-properties.svelte` malformed template, dead `BLEND_MODES` references) — separate concern but the typecheck stays noisy until they're addressed.
3. Save-file `migrateSerializedShader` is **no longer needed** post-V0 since there are no users; do not re-introduce it.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Half-migrated state bricks the editor mid-session | Phase B must land atomically. Don't commit partway. |
| The 35 pre-existing errors mask new ones | After each major Phase B file, do `bun run check 2>&1 \| grep -E "(error\|TS)" \| wc -l` and confirm the count is stable or lower. |
| `this.inputs.foo` typo against wrong schema key | TS catches keys when generics are wired; manual browser pass catches semantic drift on default values. |
| Codegen reads `cls.uniforms` from the legacy path | Phase B step 6 must touch every codegen file in one go; partial yields runtime `undefined.parse(...)`. |
| `ProceduralShader` subclass registration order matters (presets self-register at module import) | Keep the existing pattern: each preset file ends with `register(Foo); export default Foo;`. The `textures/index.ts` barrel already imports each file, triggering registration. |
| Migration plan diverges from reality again | When work lands, *also update `docs/shader-rename-unification.md`* — strike through the Session 3-4 prospective claims and replace with what actually happened. |

## Decision points before execution

1. **Single-commit vs. category-by-category PRs for Phase B?** Single-commit is safer (the type web tears mid-conversion otherwise) but yields a ~110-file diff. Category-by-category is reviewable but requires holding the editor in a non-working state across PRs.
2. **Whether to fix the 5 pre-existing errors that intersect the migration surface** (`Layer` not exported, `Shader` not in barrel) as part of Phase B, or separately. Recommend folding them in — they're already in the path.
3. **`procedural-field.svelte.ts` removal**: the plan deletes it. If any saved scenes reference `typeId: "procedural-field"`, they break. Per the V0 + no-users premise, fine to drop without migration. Confirm.

---

*Recommend executing Phase A immediately (committing the untracked foundation) regardless of Phase B timing — it costs nothing and protects existing work from another stray reset.*
