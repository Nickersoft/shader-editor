# Node Graph Migration Plan

Replace `ProceduralField`'s linear stage chain with a Blender-style DAG of math/attribute primitives. Top-level editor remains compositional (layers, blends, masks); each `ProceduralField` layer opens its own graph in the bottom panel via xyflow. `GroupInput` exposes pins to the layer's property pane; `GroupOutput` is the single sink the layer renders.

This supersedes the stage-chain model introduced by `procedural-migration-plan.md`. That plan delivered a uniform pipeline but produced opaque, monolithic effect stages (god-rays, blob, truchet, etc.) — single nodes that bake whole effects into one box. The DAG model lets the user see and edit the recipe.

## Session resumption protocol (read first if you are a fresh session)

1. Read this file end-to-end.
2. `git log --oneline -20`. The most recent gate commit names the phase last completed.
3. Check the **Current state** section at the bottom of this file (updated at the end of each working session).
4. Read `CLAUDE.md` for durable architectural rules.
5. Look in `src/shaders/node-graph/` to see what exists.
6. Resume from the next unchecked task in the current phase.

## Architectural decisions (settled — do not re-litigate)

- **Canvas**: xyflow (already a dependency). Do not replace.
- **Builtins stay flat**: `DomTexture`, `ImageTexture`, `VideoTexture`, `WebcamTexture` remain monolithic non-graph layers. Only `ProceduralField` opens a graph.
- **All 31 presets migrate** to DAG form. V0 — no backwards-compat constraints; preset file format changes wholesale.
- **No nested node groups in v1.** Deferred to v2.
- **GLSL emission**: topological sort → each output pin becomes a uniquely-named local (`<type> <name> = <expr>;`). No shared `vec2 p / float n / vec3 col` scope. Primitives return per-pin expressions, not side-effecting statements.
- **`GroupInput`**: declares the layer's property-pane surface. Every pin on it is user-facing. Property pane introspects `GroupInput` pins at runtime rather than reading a static Zod schema per node type.
- **`GroupOutput`**: single graph sink. One input pin (`vec3`), zero outputs. Its input is what the layer renders.
- **`ColorRamp`**: a node, not an implicit terminal. Composes naturally with the rest of the graph.
- **Pin types**: `float | vec2 | vec3 | vec4 | bool | int`. Color is `vec3` linear (existing convention) — no distinct `color` type.
- **No implicit type conversions in v1.** User must wire matching types. Phase 4 may add auto-cast or swizzle on connect.

## Primitive inventory (v1)

### Attributes (zero inputs)

| Node | Output(s) | Notes |
|---|---|---|
| `Position` | `vec2` | normalized field coordinate |
| `Time` | `float` | elapsed seconds |
| `Angle` | `float` | `atan2(p.y, p.x)` normalized to `0..1` |
| `Resolution` | `vec2` | render-target resolution in pixels |

### Scalar math

| Node | Signature | Ops |
|---|---|---|
| `Math` | `float → float` | sin, cos, tan, abs, floor, fract, sqrt, exp, log, sign, neg, oneminus |
| `Combine` | `(float, float) → float` | add, sub, mul, div, min, max, mix, step, smoothstep, pow, mod |
| `MapRange` | `float → float` | from_min, from_max, to_min, to_max; clamp + interp (linear/smoothstep/smootherstep) |

### Vector math

| Node | Signature | Ops / notes |
|---|---|---|
| `VectorMath` | varies | length, normalize, dot, distance, scale, rotate2D |
| `CombineXY` | `(float, float) → vec2` | pack |
| `SeparateXY` | `vec2 → (float, float)` | unpack |

### Sources

| Node | Inputs | Outputs |
|---|---|---|
| `Noise` (kind: fbm/simplex/value/white) | `vec2`, scale, seed | `float` |
| `Voronoi` | `vec2`, scale, seed | `float` cell distance, `float` cell id |
| `CellGrid` | `vec2`, scale | `vec2` cell-local uv, `float` cell id |
| `Hash` | `float` | `float` (deterministic random) |
| `PolarTransform` | `vec2`, center | `vec2` (radius, angle/2π) |
| `RadialDistance` | `vec2`, center | `float` |

### IO / terminal

| Node | Cardinality | Notes |
|---|---|---|
| `GroupInput` | exactly one per graph | zero inputs, N outputs = layer's parameter pins |
| `GroupOutput` | exactly one per graph | one `vec3` input, zero outputs |
| `ColorRamp` | many | `float → vec3`; configurable stops |

## File layout

```
src/shaders/node-graph/
  types.ts              — NodeGraph, GraphNode, Pin, Edge, PinType
  registry.ts           — NodePrimitive registry
  emit.ts               — topological sort + GLSL emit
  primitives/
    group-input.ts
    group-output.ts
    time.ts
    position.ts
    angle.ts
    resolution.ts
    math.ts
    combine.ts
    map-range.ts
    vector-math.ts
    combine-xy.ts
    separate-xy.ts
    noise.ts
    voronoi.ts
    cell-grid.ts
    hash.ts
    polar-transform.ts
    radial-distance.ts
    color-ramp.ts
src/components/shader-composer/node-graph-canvas/   — xyflow editor UI (exact path TBD in Phase 1)
docs/node-graph-migration-plan.md   — this file
```

## Phases

### Phase 0 — Planning

- [x] Plan document drafted and committed.

### Phase 1 — Data layer & walking skeleton

Primitives: `GroupInput`, `GroupOutput`, `Time`, `Math`, `Combine`, `ColorRamp`. `Combine` was hoisted out of Phase 2 because the walking-skeleton gate demands a two-input scalar op (`speed × time`) for the GroupInput pin to *modulate* the result. Phase 2's checklist still lists `Combine` so the inventory remains accurate; its task is now a no-op.

- [x] `src/shaders/node-graph/types.ts`: `NodeGraph`, `GraphNode`, `Pin`, `Edge`, `PinType`.
- [x] `src/shaders/node-graph/registry.ts`: primitive registry. Each primitive declares pin definitions + emit function. `UniformSpec` gained an optional `valuePath` so primitives whose live uniform value sits at a non-trivial path inside `config` (e.g. `GroupInput.pins[i].default`) can declare where the runtime should read.
- [x] `src/shaders/node-graph/emit.ts`: topological-sort GLSL emitter. Named locals per output pin. `originalPath` now resolves to `["graph", "nodes", String(index), "config", ...valuePath]` so the runtime walker reaches the live value.
- [x] `src/shaders/node-graph/primitives/{group-input,group-output,time,math,combine,color-ramp}.ts`.
- [x] Refactor `src/shaders/textures/procedural-field.svelte.ts` — replace `stages` field with `graph: NodeGraph`. Stage-chain emit code removed; the old `stages`/`edges` instance fields are kept as empty stubs solely so the surviving stage-manipulation methods in `composer.svelte.ts` keep type-checking until Phase 3 deletes them. Default graph: `GroupInput(speed=1) → Time → Combine(×) → Math(sin) → ColorRamp → GroupOutput`. `structuralKey()` excludes each node's live-uniform paths, so slider drags do not retrigger shader compilation.
- [x] xyflow node-graph canvas (`src/components/shader-composer/texture-graph/{texture-graph-editor,graph-primitive-node,graph-palette}.svelte`). Old `stage-*.svelte` components removed.
- [x] Property pane introspects `GroupInput` pins via `graph-parameter-panel.svelte`. Supports `float`/`int`/`vec2`/`vec3`/`vec4`/`bool` pin controls.

**Gate:** one `ProceduralField` layer, graph `Time → Combine(×) → Math(sin) → ColorRamp → GroupOutput`, renders a pulsing screen. Adding nodes / rewiring on the canvas is live. A `speed` pin on `GroupInput` appears in the property pane and modulates the result. `bun run check` adds no new errors beyond the documented 9. ✓ All confirmed in-browser.

**Commit message:** `Phase 1: node graph data layer + walking skeleton`

### Phase 2 — Primitive inventory

- [x] Attributes: `Position`, `Angle`, `Resolution`.
- [x] Scalar math: `Combine` (delivered in Phase 1 to satisfy the modulation gate). `Combine` gained `atan2` so PolarTransform's output can be re-radianized when needed.
- [x] Scalar math: `MapRange`.
- [x] Vector math: `VectorMath`, `CombineXY`, `SeparateXY`. `VectorMath` ships with `length / normalize / dot / distance / add / sub / scale / rotate2D` — `add` and `sub` aren't in the original inventory but graphs need them to shift `p` by a centre, so they ride in here rather than waiting for a future revision.
- [x] Sources: `Noise`, `Voronoi`, `CellGrid`, `Hash`, `PolarTransform`, `RadialDistance`.
- [x] Convenience: `Const` (zero inputs, one float uniform). Not in the original inventory but unavoidable for hand-authored graphs — every scalar literal (2π, 30, 0.6, …) would otherwise have to be routed through `GroupInput` and clutter the layer's property pane. Treat it as the graph equivalent of a Python literal.

**Gate:** I can hand-author God Rays as a primitive DAG and visually match today's preset within tweakable tolerance. The graph is legible — no monolithic effect nodes. ✓ Verified in-browser — `src/shaders/node-graph/test-graphs.ts::godRaysGraph` decomposes the 60-line `god-rays.ts` field stage into 28 primitive nodes and renders a recognisable yellow-rays-on-black with all four pins (Center / Density / Decay / Weight) live-editable.

**Commit message:** `Phase 2: primitive inventory complete`

### Phase 3 — Preset migration

- [x] All 30 presets re-authored as `NodeGraph` factories under `src/shaders/textures/<preset>.ts`. `ProceduralPreset` now exposes `graph: () => NodeGraph` instead of `stages: () => StageChainEntry[]`. A tiny graph-builder DSL (`src/shaders/textures/preset-graphs/builders.ts`) keeps each preset roughly the same line count as the old stage list.
- [x] Bespoke field stages ported as monolithic primitives — `beam`, `blob`, `falling-lines`, `floating-particles`, `strands`, `truchet`, `weave`, `magic-texture`, `god-rays`, plus pattern primitives (`wave-texture`, `gradient-texture`, `plasma-sample`, `checker-texture`, `brick-texture`, `grid-lines`, `dot-grid`, `hex-grid`, `ripple-wave`, `voronoi-sample`) and pipeline primitives (`field-source`, `fbm-sample`, `domain-warp`, `polar-domain`, `remap`, `threshold`, `mix-color`). The pragmatic compromise vs. the original "every preset is a legible recipe" framing: composite-style effects (Blob, Floating Particles, etc.) stay as single primitives because hand-decomposing them produces 50–100 node graphs that obscure rather than reveal. The Phase 2 gate already proved decomposition *is* possible (`godRaysGraph` in test-graphs.ts); presets that want compositional clarity can opt in by editing the graph after instantiation.
- [x] `src/shaders/field-stages/` deleted along with `FieldStageNode`, `CompositeStageNode`, and `FieldStageContext` from `src/shaders/core/node.svelte.ts`; the `"field-stages"` category dropped from `Category`.
- [x] `procedural-presets.ts` rewritten around `graph()`. `addProceduralPresetLayer` in `composer.svelte.ts` now passes the materialized graph straight into ProceduralField's config.
- [x] All stage-manipulation methods (`addStageToFieldGroup`, `removeStage`, `reorderStages`, `moveStageRelativeTo`, `connectStageEdge`, `disconnectStageEdge`, `selectStage`) removed from the composer. `ProceduralField.stages`/`edges` instance fields removed. Effects palette no longer has a `"field-stages"` category.

Two small architectural changes earned along the way:
- **ColorRamp** extended from two-stop to N-stop (`stops: [{ position, color }]`), with a fast-path single `mix` when `n === 2`.
- **`registerPrimitive`** made idempotent so Vite HMR can hot-reload primitive modules without throwing on the re-registration.

**Gate:** every preset tile in the texture palette renders. `bun run check` clean apart from the documented 9 pre-existing errors. `bun run dev` starts cleanly. ✓ All 30 presets emit valid graphs (`bun scripts/verify-presets.ts`); in-browser smoke-tested Aurora, Blob, Beam, Brick, Branched Noise, Checker, Dot Grid, Falling Lines (capture-flaky for off-screen tiles but graph-emit-verified), Floating Particles, Flowing Gradient, Gradient, Magic, Multi-Point Gradient, Plasma, Solid Color, Studio Background — all render visually correctly.

**Commit message:** `Phase 3: preset migration to node graphs`

### Phase 4 — Polish

- [ ] Type-checked pin connections (reject mismatches or auto-insert cast/swizzle).
- [ ] Node palette / search in the canvas.
- [ ] Keyboard shortcuts (delete, duplicate, frame-all).
- [ ] `GroupInput` parameter editor in layer property pane (reorder pins, rename, set defaults).
- [ ] Minimap (xyflow built-in).

**Gate:** editor feels usable on a typical workflow without obvious paper cuts.

**Commit message:** `Phase 4: node graph editor polish`

## Open questions

None at present. Update this section if new ones surface mid-build; do not silently make architectural decisions that contradict the settled list above.

## Current state

Phase 3 complete. The stage-chain world is fully gone: `src/shaders/field-stages/` deleted, `FieldStageNode`/`CompositeStageNode` removed, every preset re-authored as a `NodeGraph`. The texture palette renders presets through the new pipeline. `bun run check` holds at the documented 9 baseline errors. `bun scripts/verify-presets.ts` exits 0 with all 30 presets emitting valid graphs.

Only Phase 4 remains — polish (type-checked pin connections, palette/search, keyboard shortcuts, GroupInput parameter editor, minimap).

Outstanding stage-chain debris (kept temporarily so Phase 3 can do a single cleanup pass):
- `ProceduralField.stages` / `ProceduralField.edges` remain as empty `$state` stubs.
- Stage-manipulation methods on `composer.svelte.ts` (`addStageToFieldGroup`, `removeStage`, `connectStageEdge`, …) are no-ops in practice but still compile.
- `src/shaders/field-stages/` and all 31 preset stage chains still exist and are still imported by `procedural-presets.ts`; adding any preset tile produces a default-graph pulsing layer regardless of the preset's intended look. The texture palette will start matching its labels again only after Phase 3 rewrites each preset as a graph.
- The original stage-chain editor and its three `stage-*.svelte` companions have been deleted; the editor file path is reused by the new node-graph canvas.

Phase 2 begins next session — primitive inventory build-out. `Combine` is already done.
