# Procedural Migration Plan

Port the remaining standalone texture nodes into the Procedural Field system, so the editor has a uniform "stage chain → color ramp" pipeline for every procedural texture.

## Current state (snapshot)

`src/shaders/field-stages/` holds the stage primitives. `src/shaders/textures/procedural-field.svelte.ts` is the container generator. `src/shaders/textures/procedural-presets.ts` aggregates per-file preset objects.

Already ported (preset files under `textures/`):

- checkerboard, stripes, gradient, multi-point-gradient, voronoi (replaced their standalone classes)
- simplex-noise, swirl, plasma, flowing-gradient, branched-noise, brick, magic, wave-rings, white-noise (preset-only, no original)

Still standalone, still rendering through their own `GeneratorNode` subclass:

- Bracket 1 (trivial): solid-color, sine-wave, grid, dot-grid, hex-grid, ripples, spiral, aurora, studio-background
- Bracket 2 (bespoke samplers): beam, godrays, truchet, weave
- Bracket 3 (composite-output): blob, floating-particles, falling-lines, strands
- Out of scope (external sources): image-texture, video-texture, webcam-texture, domtexture

`FieldStageNode` lives in `src/shaders/core/node.svelte.ts` alongside the other Node subclasses. The factory `defineFieldStage` no longer exists — every stage is a direct class. Container's `structuralKey()` folds non-uniform config and a per-instance `variantKey()` into the rebuild key so enum/zero-distortion changes prune dead GLSL branches.

## Conventions to follow

Every new stage file follows the canonical class shape:

```ts
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

const config = z.object({ /* ... */ });
const inputs = z.object({});
const meta: NodeMeta = { /* ... */ };

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class StageName extends FieldStageNode<Config, Inputs> {
  static readonly typeId = "stage-name";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = { /* ... */ };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return { main: `/* ... */` };
  }
}

register(StageName);
export default StageName;
```

Every preset file follows:

```ts
import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "preset-id",
  name: "Display Name",
  description: "...",
  color: "#hex",
  stages: () => [/* StageChainEntry[] */],
} satisfies ProceduralPreset;
```

After each phase, update:
- `src/shaders/field-stages/index.ts` (new stage exports)
- `src/shaders/textures/procedural-presets.ts` (new preset imports + array entries)
- `src/shaders/textures/index.ts` (remove deleted standalone class exports)

Then `bun run check` — verify only the pre-existing nine unrelated errors remain.

---

## Phase 1 — Trivial ports (~half a day)

### 1a. Three new stage primitives

- `field-stages/grid-lines.ts` — orthogonal line grid. Config: `scale`, `lineWidth`, `softness`. Math: `aastep` against `min(fract(p.x*scale), fract(p.y*scale)) < lineWidth`.
- `field-stages/dot-grid.ts` — circular dot per cell. Config: `scale`, `radius`, `softness`. Math: `aastep` on `length(fract(p*scale) - 0.5) < radius`.
- `field-stages/hex-grid.ts` — hex tile distance. Config: `scale`, `lineWidth`. Use a standard hex-distance formula (see existing `textures/hex-grid.ts`) emitted into `n`.

### 1b. Nine preset files (each replaces a standalone)

Replace these standalone files with preset files (same path). Copy default values from the originals before deletion.

| Replace this file | With preset |
|---|---|
| `textures/solid-color.ts` | `{ typeId: "color-ramp-2", config: { colorA: <orig>, colorB: <orig> } }` (no field source needed; n stays at 0.5, ramp emits a constant) |
| `textures/sine-wave.ts` | `field-source` + `wave-texture(bands, sine)` + `color-ramp-2` |
| `textures/grid.ts` | `grid-lines` + `color-ramp-2` |
| `textures/dot-grid.ts` | `dot-grid` + `color-ramp-2` |
| `textures/hex-grid.ts` | `hex-grid` + `color-ramp-2` |
| `textures/ripples.ts` | `wave-texture(rings, sine, distortion=0)` with `phaseOffset` animated. Or, if more faithful needed: new tiny `ripple-wave` stage emitting `0.5 + 0.5*cos(r*freq − t*speed)`. |
| `textures/spiral.ts` | `polar-domain` + `wave-texture(bands, sine)` + `color-ramp-2` |
| `textures/aurora.ts` | `field-source` + 2× `domain-warp` + `fbm-sample` + `color-ramp-4`. Tune to match. |
| `textures/studio-background.ts` | `gradient-texture(spherical)` + `color-ramp-2` (or `color-ramp-4` for richer tint). |

### 1c. Update the barrels

Remove the corresponding `export { default as X } from "./X"` lines from `textures/index.ts`.

---

## Phase 2 — Bespoke samplers (~half a day)

Four new stage primitives. Each ports the original standalone shader's math into a sampler that writes `n`. Reference each original under `src/shaders/textures/` for the algorithm and defaults.

- `field-stages/beam.ts` — directional gradient + falloff. Config: `angle`, `width`, `softness`. ~30 lines.
- `field-stages/god-rays.ts` — sun-relative radial sample, jittered along ray. Config: `center`, `density`, `decay`, `weight`. ~50 lines.
- `field-stages/truchet.ts` — per-cell hash chooses one of two arc patterns. Config: `scale`, `lineWidth`. ~40 lines.
- `field-stages/weave.ts` — over/under threading. Config: `scale`, `lineWidth`, `gap`. ~40 lines.

Then four preset files replacing the originals:

| Replace this file | With preset |
|---|---|
| `textures/beam.ts` | `beam` + `color-ramp-2` |
| `textures/godrays.ts` | `god-rays` + `color-ramp-2` |
| `textures/truchet.ts` | `truchet` + `color-ramp-2` |
| `textures/weave.ts` | `weave` + `color-ramp-2` |

---

## Phase 3 — Composite stages (~one day)

These standalones write directly to `col` with additive/screen accumulation rather than feeding a scalar `n` into a color ramp. They don't fit the field-stage model cleanly without an extension.

### Decision point: introduce `CompositeStageNode`, or keep these as bespoke generators?

**Option A — introduce `CompositeStageNode`** (recommended for uniformity). Sketch:

1. In `src/shaders/core/node.svelte.ts`, add:
   ```ts
   export abstract class CompositeStageNode<C, I> extends Node<C, I> {
     static readonly uniformTypes: FieldStageUniformTypes<Record<string, unknown>> = {};
     abstract glsl(ctx: FieldStageContext<C>): FieldStageGlsl;
   }
   export function isCompositeStageNode(n: Node): n is CompositeStageNode { /* ... */ }
   ```
   The `glsl()` writes to a fresh local `vec3 _stage_col` instead of `col`.

2. In `procedural-field.svelte.ts`, when emitting a composite stage:
   ```glsl
   { vec3 _stage_col = vec3(0.0); <stage main>; col = mix(col, _stage_col, stage.opacity); }
   ```
   (Or use the existing blend-mode helpers — the Node base already has `blendMode` and `opacity` fields.)

3. Update `layout` derived to walk composite stages alongside field stages, contributing uniforms the same way.

4. Update `effects-palette.svelte` and the texture-graph panels to surface composite stages alongside field stages (probably just the same picker, filtered by a `kind` flag).

Cost: ~150 LOC of infrastructure.

**Option B — keep these as four standalone generators**. Cost: 0 LOC, but the procedural-vs-standalone seam persists for these four nodes.

### If Option A, the four ports

- `field-stages/blob.ts` — metaball field with per-blob position/radius. Math from the original `blob.ts`. Composite output: `_stage_col = blobColor * field`.
- `field-stages/floating-particles.ts` — 12-layer hash particles. Algorithm in `textures/floating-particles.ts:60–119`. Composite output: `_stage_col = accum`.
- `field-stages/falling-lines.ts` — streak rendering. Composite output: `_stage_col += stripe color * mask` per row.
- `field-stages/strands.ts` — fiber distribution. Composite output: `_stage_col = strandColor * mask`.

Then four preset files replacing the originals (each is just a single composite stage):

| Replace this file | With preset |
|---|---|
| `textures/blob.ts` | `blob` |
| `textures/floating-particles.ts` | `floating-particles` |
| `textures/falling-lines.ts` | `falling-lines` |
| `textures/strands.ts` | `strands` |

---

## Verification gates

After each phase:

1. `bun run check` — only the nine pre-existing errors (`canvas/utils.ts`, `registry.ts`, `fragment.ts`, `scene.svelte.ts`, sortable layer components) should remain. Anything new is regression.
2. `bun run dev` — Vite should start cleanly. If it logs a module-resolution error, a stage's `register(...)` is probably missing or its `typeId` collides.
3. In the editor, open the texture palette and confirm each new preset's tile renders. Open one, scrub parameters — confirm no shader recompile on every uniform tweak (only on enum / preset-id change).

## Quick-start for the new session

The conversation that produced this plan ran the `/simplify` workflow, then merged `FieldStageNode` into `node.svelte.ts`, then deleted `defineFieldStage` and `field-stage-node.svelte.ts`. The bottom of `node.svelte.ts` is the canonical reference for the stage abstraction. The branch is `port/sveltekit`.

Read in this order to get oriented:

1. `src/shaders/core/node.svelte.ts` — `FieldStageNode` and `FieldStageNodeClass` definitions.
2. `src/shaders/textures/procedural-field.svelte.ts` — container, structural key, layout derived.
3. `src/shaders/field-stages/checker-texture.ts` — simplest sampler stage (template for Phase 1 stages).
4. `src/shaders/field-stages/wave-texture.ts` — stage with structural enums + `variantKey()` (template for Phase 2 stages with non-uniform config).
5. `src/shaders/textures/checkerboard.ts` — preset file shape (template for all phase preset files).

Start with Phase 1 since it requires zero infrastructure and lands the most-trafficked nodes first.
