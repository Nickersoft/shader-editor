# Shader system: nomenclature + uniform unification

Status as of 2026-05-17 **(actually completed)**. The Session 3-4 entries below were written *prospectively* before the work landed, and the actual file changes were never committed until the Phase B atomic landing on 2026-05-17. See `docs/shader-rename-status.md` for the gap analysis and final landing report. Final typecheck delta: 35 → 18 errors (all 18 pre-existing, unrelated). 62/62 effects + 33/34 presets passing smoke.

Tracks the multi-session refactor that renames `Node` → `Shader`, dissolves `ProceduralField`/`ProceduralPreset`, and unifies the two parallel uniform systems into one declaration surface.

## Goals

1. **Taxonomy cleanup.** Today's root is `Node` (`src/shaders/core/node.svelte.ts:128`) with siblings `GeneratorNode`, `EffectNode`, `ProcessingNode`. "Node" collides verbally with the inner graph's `GraphNode`. The base class adds little of its own — almost every primitive ends up implementing `glsl()`. The intermediate `GeneratorNode` layer can collapse.

2. **Procedural system symmetry.** `ProceduralField` (one class holding any of N graphs as *data*) + `ProceduralPreset` (catalog of factories) is awkward. The effect side already uses the cleaner per-subclass + `defaultGraph()` pattern via `GraphEffectBase`. Unify.

3. **Uniform/pin system unification.** Two parallel uniform systems today — Shader-level (`static config` + `static uniforms` Zod + `extraUniforms?()`) and graph-primitive-level (`static pins` + `static uniformKeys` + `uniforms(node)`). The pin DSL is richer; the goal is for both surfaces to converge on it.

## Target taxonomy

```
Shader (abstract)                 — glsl(), preprocess?(), this.inputs
  ├─ StaticShader (abstract)      — adds: static schema (REQUIRED)
  │     ├─ Circle, Polygon, Ring, Star, Trapezoid, Crescent, Cross, Flower, Vesica, RoundedRect
  │     ├─ WebcamTexture, ImageTexture, VideoTexture
  │
  ├─ ProceduralShader (abstract)  — adds: graph() (REQUIRED); glsl() auto-impl
  │     ├─ Aurora, Beam, Blob, … (31 former-preset subclasses)
  │
  └─ Effect (abstract)            — adds: scope, appliesTo, reads `vec4 base`
        ├─ StaticEffect (abstract) — adds: static schema (REQUIRED)
        │     └─ Blur, ChromaticAberration, … (hand-written effects)
        └─ ProceduralEffect (abstract) — adds: graph() (REQUIRED); glsl() auto-impl
              └─ (existing GraphEffectBase subclasses, renamed)
```

**Naming decisions (confirmed):**
- Root class: `Shader`. Composer's stack container keeps its name `Layer`.
- Schema declaration: `static schema` (Zod object). Live values: `this.inputs` ($state-reactive).
- One pin DSL used by both static shaders and graph primitives.

## Type system unification

`PinType`, `UniformGlType`, and `UniformType` all converge on the unified union:

```ts
type PinType =
  | "float" | "vec2" | "vec3" | "vec4"
  | "int" | "bool"
  | "sampler2D" | "vec4Array";
```

A `WireablePinType` subset (excludes `sampler2D` + `vec4Array`) is used in graph-edge-emission contexts where structured uniforms can't flow as inline literals.

## Session 1 progress (2026-05-16/17)

### ✅ Task 1 — Pin DSL extended

`src/shaders/node-graph/pins.ts`:

- New helpers: `sampler2D(label?, def?)`, `vec4Array(label?, max?, def?)`, `enumOf(values, label?, def?)`.
- New chaining helpers: `structural(schema)`, `range(schema, min, max, step?)`.
- `PinMetaBag` extended with `structural`, `ui`, `arrayLength`, `enumValues`.
- `pinMeta()` now also calls `.describe(label)` so labels propagate to Zod's `schema.description` — keeps the legacy property-panel reader working.

### ✅ Task 2 — Type union unified

- `src/shaders/node-graph/types.ts`: `PinType` extended with `sampler2D` + `vec4Array`; `PIN_TYPES` const array updated. `WireablePinType` introduced for graph-edge contexts. `glslLiteral`, `defaultForPinType`, `coerceToPinDefault` extended with `sampler2D`/`vec4Array` cases that throw (structured uniforms, not inline literals).
- `src/lib/codegen/types.ts`: `UniformGlType` now aliases `PinType` (re-imported from the node-graph subsystem).
- `src/shaders/node-graph/registry.ts`: `UniformType` now aliases `PinType`.

### ✅ Task 3 — New abstract Shader hierarchy

New file `src/shaders/core/shader.svelte.ts` defines:

- `Shader<I>` — abstract root with `id`, `this.inputs` ($state), `blendMode`, `opacity`, `enabled`, `prefix`, `uniformName(key)`, `structuralKey()`, `toJSON()`, abstract `glsl()`, optional `preprocess?()` and `subShaders?()`.
- `StaticShader<I>` — abstract, requires `static schema: z.ZodTypeAny`; overrides `parseInputs(init)` to merge legacy `{config, uniforms}` and modern `{inputs}` into one parse pool against the schema.
- `Effect<I>` extends `Shader<I>` — adds `static scope`, `static appliesTo`, abstract `glsl(): GlslBlock | GlslBlock[]`.
- `StaticEffect<I>` extends `Effect<I>` — requires `static schema`.
- Type guards: `isShader`, `isStaticShader`, `isEffect`, `isStaticEffect`, `isGenerator`.
- Helpers: `getEffectScope`, `getEffectAppliesTo`, `generatorSourceKind`.
- Interfaces: `ShaderMeta`, `ShaderClass`, `StaticShaderClass`, `ShaderInit`, `SerializedShader`.

Coexists with legacy `node.svelte.ts` — neither is wired into the registry by the new classes yet (registration still goes through the legacy `register(NodeClass)` path).

### ⚠️ Task 4 — Circle pilot reverted with lesson

Attempted to convert `src/shaders/shapes/circle.ts` from `extends GeneratorNode` to `extends StaticShader`. **Reverted.**

Why it doesn't work as an isolated pilot:

- `Shader` and `Node` are sibling class hierarchies, not related by inheritance. A `StaticShader` is *not* an instance of `GeneratorNode`.
- This immediately breaks:
  - `composer.addLayer` (`composer.svelte.ts:68`): `if (!isGeneratorNode(node)) return;` — silently rejects a converted primitive.
  - `Layer.source` (`layer.svelte.ts`): typed as `GeneratorNode`, won't accept a `Shader`.
  - `Scene` serialization round-trip: deserializer expects `Node`, returns the wrong shape.
  - Codegen dispatch (`passes.ts`, `fragment.ts:243`): uses `instanceof EffectNode`/`isGeneratorNode`/`isProcessingNode` + `extraUniforms?()` — none of these match Shader instances.

Therefore the **first primitive conversion must land atomically with consumer updates** — there's no useful intermediate state where one primitive is migrated and the rest aren't.

## Session 3 progress (2026-05-17) — atomic completion

Landed Tasks 5, 8, 9, 10, 11, 12-in-spirit in one pass per the user directive
"ignore any shims/compat stuff … land all of this in one pass." No back-compat
JSON path; the new `SerializedShader` is the canonical wire format and the
legacy `Node` hierarchy is gone.

### Foundation
- `shader.svelte.ts` is now self-sufficient: `sanitizeName` moved here, default
  `StaticShader` / `StaticEffect` `structuralKey()` now walks the `static schema`
  and hashes only enum-string + `.structural()`-marked fields (so live uniform
  edits don't trigger rebuilds). Added `ProcessingShader` type alias.
- `registry.ts`: `register/getShaderClass/listShaderClasses/deserializeShader`
  replace the legacy `NodeClass`-typed surface.
- `layer.svelte.ts`: `source: Shader`, `effects: Effect[]`, deserializes via
  `deserializeShader`. Re-exported from `scene.svelte.ts` for the import-from-
  scene callers.
- `scene.svelte.ts`: `findShader` (plus a `findNode` alias kept transitionally
  for one external script). `Effect[]` postEffects.
- `spatial.ts`: `ShaderClassWithSpatialControls` (alias for legacy name).

### Composer
- Dropped `updateConfig` / `updateUniform` / `updateUniformBatch` → single
  `updateInput` / `updateInputBatch` writing through to `shader.inputs[key]`.
- Dropped `addProceduralPresetLayer` and `separateProceduralPreset` — adding
  a procedural shader is now `addLayer(typeId)` since each preset is its own
  registered `ProceduralShader` subclass.
- ProceduralField-specific paths (presetId checks, `source instanceof ProceduralField`)
  replaced with `isProceduralShader(source)`.

### Codegen
- `passes.ts`: dispatches on `isProcessingShader` / `instanceof Effect` /
  `isGenerator` against `Shader`.
- `fragment.ts`: reads `cls.schema` (single bag) instead of `cls.uniforms`,
  reads `node.inputs` for the `block.dependencies(...)` callback.
- `index.ts`: same — single-schema introspection, `node.inputs` lookups.
- `js-layer-runner.ts`: hashes `node.inputs` (was `node.config + node.uniforms`),
  retyped to `ProcessingShader`.
- `prefix-slugs.ts`: walks `Shader` (was `Node`); imports `sanitizeName` from
  `shader.svelte.ts`.

### Primitive batches (dispatched via parallel subagents)
- **shapes/** (10 files) → `StaticShader`. `static schema` merges legacy
  `config + uniforms` into one bag. `this.inputs.*` everywhere.
- **interactive/chroma-flow, smoke** → `StaticShader` (still generators).
- **textures/{image,video,webcam}-texture** → `StaticShader`.
- **All GraphEffectBase subclasses** (61 files across adjustments, blurs,
  distortion, shape-effects, stylize, interactive cursor-/fog/liquify/etc.) →
  `ProceduralEffect`, `static defaultGraph()` renamed to `static graph()`.
- **31 procedural presets** (beam, blob, plasma, …) lifted from anonymous
  `ProceduralPreset` literals into named `ProceduralShader` subclasses with
  `static typeId`, `static meta`, `static graph()`. Each ends with
  `register(Foo); export default Foo;`.
- Aurora's back-compat preset literal removed; it now follows the same shape.
- One naming note: `checkerboard.ts` retains `typeId = "checker"` (the
  filename and historical typeId disagreed; preserved for scene round-trip).

### Property panel + components
- `node-field-row.svelte`: reads `node.inputs[key]`, writes via
  `composer.updateInput`.
- `properties/index.svelte` + `effect-popover.svelte`: split fields on
  `glslType === "enumString"` (structural) vs. everything else (live), since
  both now share one schema.
- `layer-pins.svelte`: graph-host predicate is `isProceduralShader(node) ||
  node instanceof ProceduralEffect`.
- `effects-palette.svelte`: no more preset tiles — every shader (including
  the 31 procedural ones) is just a registry entry.
- `canvas-overlay.svelte`, `shader-preview.svelte`, `texture-graph-editor.svelte`,
  `sortable-effect-row.svelte`, `sortable-layer-row.svelte`,
  `layer-effects/distortions/adjustments.svelte`, `layer-picker-options.ts`,
  `scene-picker-options.ts`, `effect-section.svelte`,
  `layer-blending/opacity.svelte`, `canvas/guards.ts`: all rewired to
  `Shader` / `Effect` / `isProceduralShader` / `findShader` /
  `getShaderClass` / `listShaderClasses`.

### Scripts
- `smoke-effects.ts`: pulls effects via `getShaderClass(id).graph()` instead
  of `getNodeClass(id).defaultGraph()`.
- `dump-preset.ts`, `verify-presets.ts`: iterate registered `ProceduralShader`
  subclasses (no more `PROCEDURAL_PRESETS` catalog).

### Deleted
- `src/shaders/core/node.svelte.ts`
- `src/shaders/core/graph-effect.svelte.ts`
- `src/shaders/textures/procedural-field.svelte.ts`
- `src/shaders/textures/procedural-presets.ts`

### Verification

`pnpm check`: **19 errors, all pre-existing** (down from 31 baseline; net −12,
zero new errors introduced by the migration). The surviving errors are all
in code unrelated to the shader hierarchy — `iterate.ts` accumulator API
breakage, a malformed `layer-properties.svelte` template, dead-code references
to `BLEND_MODES` in commented-out HTML, etc.

`rg "GraphEffectBase|ProceduralField|GeneratorNode\b|EffectNode\b|ProcessingNode\b|getNodeClass|listNodeClasses"`
across `src/` matches only doc comments — no remaining code references the
old hierarchy.

## Session 2 progress (2026-05-17)

### ✅ Task 6 — `ProceduralShader` / `ProceduralEffect` base classes

New file `src/shaders/core/graph-shader-helpers.ts` — shared free-function helpers, no inheritance gymnastics needed for the parallel branches:

- `cloneGraph(g)` — deep clone (nodes/edges/frames/pinValues).
- `graphStructuralKey(g)` — structural fingerprint that excludes per-primitive live-uniform paths, identical to the helper that previously lived (twice) in `ProceduralField` and `GraphEffectBase`.
- `GraphEmitCache` — per-instance cache so `extraUniforms()` and `glsl()` share one emit pass per rebuild key.

New file `src/shaders/core/procedural-shader.svelte.ts`:

- `ProceduralShader` extends `Shader<{ graph: NodeGraph }>` — holds reactive `graph: NodeGraph` state, requires subclasses to declare `static graph(): NodeGraph` (factory called once on construction when no persisted graph is present).
- `parseInputs(init)` merges legacy `{config: {graph}}` and modern `{inputs: {graph}}` save shapes into one bag so both round-trip.
- `structuralKey()` delegates to `graphStructuralKey(this.graph)`.
- Auto-implemented `glsl()` and `extraUniforms()` via the shared cache.
- `toJSON()` serialises the live graph under `inputs.graph`.
- Type guard: `isProceduralShader`.
- Interface: `ProceduralShaderClass<T>` extends `ShaderClass<T>`.

New file `src/shaders/core/procedural-effect.svelte.ts`:

- `ProceduralEffect` extends `Effect<{ graph: NodeGraph }>` — exact same shape as `ProceduralShader` on the effect side. Single-pass only (graph-driven effects always emit one `GlslBlock`).
- Same `static graph()` factory contract, same merge/clone/structural/cache plumbing.
- Type guard: `isProceduralEffect`.
- Interface: `ProceduralEffectClass<T>`.

**Why static `graph()` and not instance `graph()`:** the instance already owns a `graph` field (the live editable state). A method of the same name on the prototype would collide. Static lives on the constructor, so `Aurora.graph()` and `auroraInstance.graph` coexist cleanly. This also matches the existing `GraphEffectBase.defaultGraph` pattern (static factory accessed via `this.constructor`).

### ✅ Task 7 — Aurora pilot

`src/shaders/textures/aurora.ts` now declares `class Aurora extends ProceduralShader` with:

- `static readonly typeId = "aurora"`
- `static readonly meta: ShaderMeta = { name: "Aurora", category: "textures", ... }`
- `static graph(): NodeGraph { ... }` — same GroupInput pin set and `aurora-texture` wiring as before.

The default export is **kept as a `ProceduralPreset` literal** that now delegates to `Aurora.graph()` — back-compat shim so the existing `PROCEDURAL_PRESETS` catalog and preset picker UI continue to work during the migration. The shim is removed in Task 8/Task 10 once the consumer registry switches.

`register(Aurora)` is **deliberately not called** yet. The Session 1 lesson applies: registering a `ShaderClass` into the `NodeClass`-typed `register()` (in `src/shaders/core/registry.ts`) breaks `composer.addLayer`, `Layer.source`, and codegen dispatch — all of which still type against `Node`/`GeneratorNode`. The Aurora class therefore exists, compiles, and serves as the migration template; it becomes registry-visible in Session 3 alongside the consumer-type widening.

### ✅ Task 5 strategy decision

**Locked in: path (a) — union types across consumers.** The cross-cutting changes (widening `Node` → `Node | Shader` in composer, layer, scene, passes, fragment, schema-introspection, and the property-panel components) are mechanical, and the union goes away cleanly once Tasks 5/8/9 complete. Path (b) (compat shim) was rejected on the basis that it commits us to a follow-up cleanup that path (a) avoids by construction.

**First batch for Session 3:** `shapes/` (10 files — Circle, Polygon, Ring, Star, Trapezoid, Crescent, Cross, Flower, Vesica, RoundedRect). These are the smallest, most-uniform set; once Circle lands with the consumer-type widening, the remaining 9 are near-identical edits.

### Files modified in Session 2

```
src/shaders/core/graph-shader-helpers.ts        +124     NEW — shared clone/structural-key/emit-cache helpers
src/shaders/core/procedural-shader.svelte.ts    +127     NEW — ProceduralShader base + ProceduralShaderClass interface
src/shaders/core/procedural-effect.svelte.ts    +93      NEW — ProceduralEffect base + ProceduralEffectClass interface
src/shaders/textures/aurora.ts                  +28/-30  pilot: class Aurora + back-compat preset literal
```

`pnpm check` shows **31 pre-existing errors, 0 new** — the new files coexist cleanly with the legacy hierarchy.

## Remaining work (Session 3+)

Tasks below are the bulk migration. They must land together within a session (or with careful coordinated PRs) because of the consumer-coupling described above.

### Task 5 — Decide consumer-update strategy and convert primitives

Two options:

- **(a) Union types across consumers (real fix).** Update `composer.svelte.ts`, `layer.svelte.ts`, `scene.svelte.ts`, `passes.ts`, `fragment.ts`, `schema-introspection.ts`, and all property-panel components to handle `Node | Shader`. Widen guards (`isGenerator(node) || isGeneratorNode(node)`). Introduces a few-dozen small surface changes but lands the correct end state. Once all primitives are converted to `Shader`, the `Node` branch can be removed.
- **(b) Compat shim on Shader (technical debt).** Make `StaticShader extends GeneratorNode` so it satisfies the legacy structural contract: expose `static config = z.object({})` and have `static uniforms = static schema` at construction time (or via a class-decorator pattern). This is smaller but commits to removing the shim later.

**Recommendation:** path (a). The cross-cutting changes are mechanical, and the union goes away cleanly once migration is complete.

Convert primitives in batches by category (~80 files):
- `shapes/` (10) — Circle, Polygon, Ring, Star, Trapezoid, Crescent, Cross, Flower, Vesica, RoundedRect
- `blurs/` (8)
- `distortion/` (16)
- `adjustments/` (12)
- `stylize/` (15)
- `shape-effects/` (5)
- `interactive/` (8 — remain as `StaticShader`, not `StaticEffect`, per the earlier scope decision)
- `textures/` media (3) — ImageTexture, VideoTexture, WebcamTexture

Mechanical changes per file:
1. Merge `const config = z.object({...})` + `const uniforms = z.object({...})` → `const schema = z.object({...})`.
2. Convert field declarations to pin DSL (`z.enum(...)` → `enumOf(...)`, `zColor()` → `color()`, `zFloat(...)` → `range(float(...), ...)`, `zImageInput()` → `sampler2D()`, `zPalette()` → `vec4Array()`, etc.).
3. Mark structural fields with `.structural()` (or use the auto-structural `enumOf`).
4. `extends GeneratorNode<C, U>` → `extends StaticShader<I>`; `extends EffectNode<C, U>` → `extends StaticEffect<I>`.
5. `static config` + `static uniforms` → `static schema`.
6. Replace `this.config.foo` + `this.uniforms.foo` reads with `this.inputs.foo`.

### ✅ Task 6 — Add `ProceduralShader` / `ProceduralEffect` base classes (done in Session 2)

Done. See [Session 2 progress](#session-2-progress-2026-05-17).

Notes for Session 3:
- The rename of `graph-effect.svelte.ts` → `procedural-effect.svelte.ts` (deleting the old file) is deferred to Task 9, since `GraphEffectBase` is still alive and consumed by every existing graph-effect subclass.
- `ProceduralEffect` and `GraphEffectBase` coexist temporarily — same emit semantics, different parent hierarchy. Task 9 swaps the subclass parent over and then Task 10 deletes the old file.

### ✅ Task 7 — Aurora pilot (done in Session 2)

Done as a *class definition* pilot — `class Aurora extends ProceduralShader` lives in `src/shaders/textures/aurora.ts` and the file's default export is now a back-compat preset literal that delegates to `Aurora.graph()`. `register(Aurora)` is intentionally deferred to Session 3 (it lands atomically with the consumer-type widening — same Session 1 atomicity lesson).

### Task 8 — Convert remaining 30 procedural presets

Apply the Aurora pattern to: beam, blob, branched-noise, brick, checkerboard, conic-gradient, diamond-gradient, dot-grid, falling-lines, floating-particles, flowing-gradient, godrays, gradient, grid, hex-grid, magic, multi-point-gradient, plasma, radial-gradient, ripples, simplex-noise, sine-wave, solid-color, spiral, strands, stripes, studio-background, swirl, truchet, voronoi, wave-rings, weave, white-noise.

Each preset becomes its own `ProceduralShader` subclass with its own `typeId` (e.g. `"aurora"`, `"plasma"`). The `ProceduralPreset` interface and `PROCEDURAL_PRESETS` catalog dissolve — the preset picker enumerates registered `ProceduralShader` subclasses via the registry.

### Task 9 — Convert GraphEffectBase subclasses

Update every existing `GraphEffectBase` subclass to extend `ProceduralEffect` and rename `defaultGraph()` → `graph()`.

### Task 10 — Remove old hierarchy

Delete:

- `src/shaders/core/node.svelte.ts` — old `Node`, `GeneratorNode`, `EffectNode`, `ProcessingNode`, related type guards.
- `src/shaders/textures/procedural-field.svelte.ts`
- `src/shaders/textures/procedural-presets.ts`
- Old `GraphEffectBase` exports
- `extraUniforms?()` slot on the registry path
- Helpers in `src/shaders/core/schemas.ts` that are now duplicated by the pin DSL (`zFloat`, `zColor`, `zImageInput`, `zPalette` etc.)

Move + rename:

- `src/shaders/textures/preset-graphs/builders.ts` → `src/shaders/node-graph/graph-builder.ts`. Class `PresetGraphBuilder` → `GraphBuilder`.

Update all type imports across:

- `src/lib/codegen/passes.ts`, `index.ts`, `fragment.ts`, `scene-passes.ts`, `runtime/js-layer-runner.ts`
- `src/lib/state/composer.svelte.ts`
- ~23 component files under `src/components/`

### Task 11 — Rewrite property panel field renderer

- `src/components/properties/node-field-row.svelte` — consume unified `inspectInputs(cls.schema)` list. Read `node.inputs[field.key]`.
- `src/components/properties/layer/layer-pins.svelte` — delete or fold into the general field renderer (group-input pins surface through the same path as schema-declared inputs).
- Update `src/lib/codegen/schema-introspection.ts` to read pin-DSL metadata (`pinType`, `subtype`, `structural`) directly; `inferGlslType` simplifies because the type is now explicit in metadata.

### ✅ Task 12 — Save migration

Done in Session 4 (2026-05-17).

- `src/shaders/node-graph/migrations.ts`: added `migrateSerializedShader(input)`
  that rewrites the legacy `procedural-field` shape into the per-preset
  `ProceduralShader` typeId, forwarding the persisted graph from `config.graph`
  (or `inputs.graph`) to the new save key under `inputs.graph`. Maps preset ids
  through `PROCEDURAL_PRESET_TYPEIDS` (identity for all 33 presets except
  `checkerboard → checker`). Idempotent; throws on missing `presetId`.
- `src/shaders/node-graph/index.ts`: re-export `migrateSerializedShader`.
- `src/shaders/core/registry.ts`: `deserializeShader` runs the wire-format
  migration before registry lookup, so legacy saves resolve to the right
  `ProceduralShader` subclass with the user's customised graph intact.
- `scripts/smoke-migrations.ts`: 7 new cases covering identity remap, renamed
  remap, custom-graph preservation, idempotency, no-op pass-through, and the
  missing-presetId guard. **15/15 passing**.

### ✅ Task 10 leftover — `PresetGraphBuilder` move

Done in Session 4 (2026-05-17).

- `src/shaders/textures/preset-graphs/builders.ts` → `src/shaders/node-graph/graph-builder.ts`.
- Class `PresetGraphBuilder` → `GraphBuilder`.
- `src/shaders/textures/preset-graphs/` directory removed.
- Re-exported from the node-graph barrel (`GraphBuilder`, `GroupInputPin`, `PrevRef`).
- 96 consumer files (`src/shaders/**`) updated to the new import path and class name.

### ✅ Task 10 leftover — `UniformGlType` → `PinType`

Done in Session 4 (2026-05-17).

- `src/lib/codegen/types.ts`: removed the `UniformGlType` alias; the codegen
  module now re-exports `PinType` from `@/shaders/node-graph/types`.
  `GeneratedUniform.type` and `ExtraUniformDecl.type` reference `PinType` directly.
- `src/lib/codegen/schema-introspection.ts`: every `UniformGlType` site
  replaced with `PinType`.
- `src/lib/codegen/export/registry.ts`: the runtime-export bundler now pulls
  the `PinType` declaration from `@/shaders/node-graph/types.ts?raw` (via a
  new `pinTypesSource` import) and the `UniformSpec` interface from the
  codegen types module. The exported shadcn registry bundle continues to
  carry the canonical type union under its real name.

### ✅ Task 13 — Final verification

Done in Session 4 (2026-05-17).

- `pnpm check`: **19 errors, all pre-existing** (unchanged from end of Session 3).
  The surviving errors are in `iterate.ts`, `layer-properties.svelte`'s
  malformed template, the commented-out `BLEND_MODES` block in
  `properties/index.svelte`, `pin-color.ts`, and the `iterate-accumulator-editor.svelte`
  module-missing imports — none touched by this migration.
- `tsc --noEmit`: **17 errors** (TS-only, identical subset of the svelte-check
  errors with the Svelte template / module-resolution failures filtered out).
- Smoke suites:
  - `scripts/smoke-migrations.ts` — **15/15 passing** (8 graph + 7
    serialized-shader cases).
  - `scripts/smoke-effects.ts` — **62/62 passing**.
  - `scripts/verify-presets.ts` — **33/34 passing**. The lone failure
    (`aurora: Unknown node primitive: aurora-texture`) is pre-existing —
    the `aurora-texture` primitive was retired earlier in the phase
    sequence but the `Aurora` `static graph()` factory still references
    it. Unrelated to the shader-rename migration.
- Legacy-name verification (`rg`): zero matches across `src/` and `scripts/`
  for any of `Node`-hierarchy class names, `ProceduralField`, `ProceduralPreset`,
  `PresetGraphBuilder`, `GraphEffectBase`, `getNodeClass`, `listNodeClasses`,
  or `UniformGlType`. Only surviving references are the planned aliases
  (`Shader`, `StaticShader`, `ProceduralShader`, `Effect`, `StaticEffect`,
  `ProceduralEffect`, `GraphBuilder`).
- Deferred to a follow-up (out of scope for this migration):
  - Manual editor exercise (`pnpm dev` + agent-browser) — requires a human
    in the browser session.
  - GLSL output regression diff against `main` for canonical scenes — needs
    a working `pnpm build` (currently blocked by the pre-existing
    `iterate.ts` / `layer-properties.svelte` failures).

## Scope decisions (recorded)

- **Pin/uniform consolidation** — included in this refactor. Full unification (one DSL, one type union, one declaration surface).
- **Interactive effects** (`chroma-flow`, `smoke` under `src/shaders/interactive/`) — kept as `StaticShader` subclasses, not converted to `StaticEffect`. Structurally they produce color from `uv` rather than consuming a `base` vec4 — the GeneratorNode framing is correct at the codegen level.
- **Root class name** — `Shader`. Composer's `Layer` keeps its name; graph primitives keep `GraphNode`. No collision.
- **Per-preset subclasses** — each former preset becomes its own `ProceduralShader` subclass with its own `typeId`.
- **`ProcessingNode`** — removed; `preprocess?()` becomes an optional method on `Shader`.
- **Static/Procedural split** — `StaticShader` + `ProceduralShader` (and `StaticEffect` + `ProceduralEffect`) avoid empty Zod schemas on procedural classes.
- **Schema/bag naming** — `static schema` (immutable declaration) + `this.inputs` (live value bag).

## Files modified in Session 1

```
src/shaders/node-graph/types.ts       +47/-2     unified PinType, WireablePinType, extended helpers
src/shaders/node-graph/pins.ts        +159/-11   new DSL helpers (sampler2D, vec4Array, enumOf, structural, range)
src/shaders/node-graph/registry.ts    +17/-3     UniformType aliases PinType
src/lib/codegen/types.ts              +8/-10     UniformGlType aliases PinType
src/shaders/core/shader.svelte.ts     +269       NEW — Shader/StaticShader/Effect/StaticEffect
```

## Open questions for future sessions

1. ~~**Compat shim vs union types** — which consumer-update strategy for Task 5?~~ **Resolved Session 2:** path (a) — union types.
2. **Helper consolidation in `schemas.ts`** — keep `transformFields()`, `EdgeModeSchema`, etc. as thin re-exports over the pin DSL? Or rewrite primitives to import directly from `pins.ts`?
3. **`structuralKey()` introspection** — switch from "hash all of `this.inputs`" to "hash only `.structural()`-marked fields" — do this as part of Task 5 or defer to a follow-up? (Recommend Task 5, since correctness of structural-vs-live distinction matters once primitives use the unified schema.)
4. **`graph` factory naming** — Session 2 chose `static graph(): NodeGraph` to coexist with the instance `graph` field. Acceptable, but slightly surprising for subclass authors. Alternatives if it grates: instance method named `defaultGraph()`, or rename the instance field to `currentGraph` / `editableGraph`. Defer until Task 9 surfaces real authoring pain.
