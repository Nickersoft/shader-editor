---
name: new-primitive
description: Author a new node-graph primitive under src/shaders/node-graph/primitives. Enforces Blender shader-node parity, atomicity, dropdown-variant style, and the existing file conventions. Use when the user asks to "add a primitive", "add a node", "create a new shader node", or invokes /new-primitive.
---

<!-- cSpell:words GLSL Glsl smoothstep voronoi chebychev parameterised behaviour summarise pushback colour colours BSDF BSDFs Toon Gabor -->

# New Primitive

You are authoring a new node-graph primitive in this project's shader editor. The working set of primitives lives at `src/shaders/node-graph/primitives/`. This skill encodes the strict rules every new primitive must follow.

## Step 1 — Always begin by interviewing the user

Do **not** start writing code until you have asked the user:

1. **Purpose** — what is this primitive supposed to do, in plain language?
2. **Context** — where will it be used? (an existing effect being decomposed, a new preset, a Blender node we're catching up to, etc.)

Use the `AskUserQuestion` tool if the user has not already volunteered both pieces of information. Both answers materially shape the design — never skip them.

## Step 2 — Validate the proposal against the rules

Before writing a single line of TypeScript, evaluate the user's proposal against the rules below. **If any rule is violated, push back and discuss with the user before proceeding.** Pushing back is mandatory, not optional. The cost of one extra round-trip is far less than the cost of merging a bad primitive.

### Rule 1 — Mirror Blender's shader nodes

The canonical taxonomy is Blender's shader-node manual: <https://docs.blender.org/manual/en/latest/render/shader_nodes/index.html>

- If Blender has a node that does this, our primitive **MUST** match its **name, category, pin shape, and config knobs** as closely as the GLSL substrate allows.
- If Blender does **not** have a node for it, ask: "Should this even be a primitive, or is it a graph of existing primitives?" Many requests dissolve here.
- The full canonical list is inlined below — consult it before proposing a name or category.

#### Canonical Blender shader-node list

This list is mirrored from the Blender 5.1 manual. **Always check this list first.** If you are about to propose a primitive name that does not appear here, stop and reconsider.

##### Input
- Ambient Occlusion
- Attribute
- Bevel
- Camera Data
- Fresnel
- Geometry
- Curves Info
- Layer Weight
- Light Path
- Object Info
- Particle Info
- Point Info
- Raycast
- Color (RGB constant)
- Tangent
- Texture Coordinate
- UV Map
- Value
- Color Attribute
- Volume Info
- Wireframe

##### Output
- AOV Output
- Material Output
- Light Output
- World Output

##### Shader (BSDFs / closures — most are not relevant to a 2D screen-space editor)
- Add Shader
- Background
- Diffuse BSDF
- Emission
- Glass BSDF
- Glossy BSDF
- Hair BSDF
- Holdout
- Mix Shader
- Metallic BSDF
- Principled BSDF
- Principled Hair BSDF
- Principled Volume
- Ray Portal BSDF
- Refraction BSDF
- Specular BSDF
- Subsurface Scattering
- Toon BSDF
- Translucent BSDF
- Transparent BSDF
- Sheen BSDF
- Volume Absorption
- Volume Scatter
- Volume Coefficients

##### Displacement (3D-only — not applicable to this editor)
- Bump
- Displacement
- Normal Map
- Vector Displacement

##### Texture
- Brick Texture
- Checker Texture
- Environment Texture
- Gabor Texture
- Gradient Texture
- IES Texture
- Image Texture
- Magic Texture
- Noise Texture
- Sky Texture
- Voronoi Texture
- Wave Texture
- White Noise Texture

##### Color
- Blackbody
- Brightness/Contrast
- Color Ramp
- Gamma
- Hue/Saturation/Value
- Invert Color
- Light Falloff
- Mix Color
- RGB Curves
- Wavelength
- Combine Color
- Separate Color
- RGB to BW
- Shader To RGB

##### Utilities → Math
- Clamp
- Float Curve
- Map Range
- Math
- Mix

##### Utilities → Vector
- Combine XYZ
- Mix Vector
- Separate XYZ
- Mapping
- Normal
- Vector Curves
- Radial Tiling
- Vector Rotate
- Vector Transform
- Combine Cylindrical
- Combine Spherical
- Separate Cylindrical
- Separate Spherical

##### Utilities (other)
- Repeat Zone
- Closure
- Evaluate Closure
- Combine Bundle
- Separate Bundle
- Join Bundle
- Menu Switch
- Script

##### Group
- Group / Group Input / Group Output

#### Categories already in use in this codebase

`input`, `texture`, `color`, `converter`, `vector`, `group`. Do not invent new categories without discussion. The Blender categories `Output`, `Shader`, `Displacement`, and `Utilities (other)` map onto our existing ones (e.g. Blender's `Utilities → Math` becomes our `converter`).

### Rule 2 — Atomic, single-purpose nodes

Each primitive must do **one thing** or contain **one algorithm**. If you find yourself describing the node with the word "and" — "computes X and then Y" — it should almost certainly be two nodes wired together.

Symptoms of a non-atomic primitive (push back if you see them):

- The proposed `emit()` body would exceed ~30 lines of GLSL excluding helper-driven loops.
- The config has knobs that gate entirely separate code paths producing different *kinds* of output (not just variants of the same kind — see Rule 3).
- The pin set changes drastically across configs (more than one or two pins coming/going).
- You're tempted to add an "enable X" boolean that bolts on a second computation.

Counter-example (good): `Math` switches between `sin`, `mul`, `smoothstep`, etc. — all are scalar-in-scalar-out arithmetic. Same kind of operation, different formula. That is a single algorithm parameterized by op.

Counter-example (bad): a hypothetical `BlurAndColorize` that blurs then tints. Two algorithms. Split into `Sampler` (linear/zoom blur) and `Mix Color` (tint), wire them.

### Rule 3 — Variants collapse into a dropdown, not separate nodes

If the user proposes "Linear Gradient" and "Radial Gradient" as two primitives, push back. The correct shape is a single `Gradient Texture` with a `type` enum — see `src/shaders/node-graph/primitives/gradient-texture.ts` for the canonical pattern.

This applies whenever variants share:
- the same conceptual job ("produce a gradient", "apply a mask shape"),
- the same I/O shape (or nearly so), and
- a small, finite set of well-known sub-types.

Existing examples to study:
- `gradient-texture.ts` — `linear | quadratic | easing | diagonal | spherical | quadratic-sphere | radial`
- `voronoi-texture.ts` — `feature: f1 | f2 | smooth-f1 | distance-to-edge`, `metric: euclidean | manhattan | chebychev`
- `mask.ts` — `shape: vignette | circle | rect | gradient-linear | gradient-radial`
- `math.ts` / `vector-math.ts` — op enum drives the entire body
- `sampler.ts` — `mode: kernel-3x3 | linear | zoom | angular`

### Rule 4 — Readable graphs, minimum nodes

The user's stated guiding principle: graphs should be *readable* and contain *no more nodes than necessary*, while every node remains atomic. These two pulls are in tension; you resolve them by:

- preferring one well-parameterized primitive over three near-duplicates (Rule 3),
- not introducing a primitive whose only role is glue between two existing ones (write the wiring, not a new node),
- not duplicating functionality already available via existing primitives + a one-line config tweak.

If the proposal would be expressible by composing 1–3 existing primitives with no new GLSL math, push back: "This already exists as the graph A → B → C. Do you want a preset/group instead of a new primitive?"

## Step 3 — Write the primitive following the file convention

Every primitive file follows the same skeleton. Do not deviate.

### Header comment

A short top-of-file comment that:
- names the primitive,
- explains what it does (the *why* of any non-obvious choices),
- documents config enums or formulas if they aren't immediately readable from the code.

See `voronoi-texture.ts` for the gold-standard header (multi-line ASCII table of feature/metric semantics) and `mix-color.ts` for the minimum bar (one-line summary).

### Imports, then schemas, then class, then `register()`

```ts
// <Name> — one-line summary.

import { z } from "zod";
import { float, vec2, color /* …pin DSL helpers */ } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({ /* … */ });
type Config = z.infer<typeof config>;

const pinIn = z.object({ /* … */ });
const pinOut = z.object({ /* … */ });
type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class MyPrimitive extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "my-primitive";       // kebab-case, matches filename
  static readonly meta: PrimitiveMeta = {
    name: "My Primitive",                        // Title Case, matches Blender
    category: "texture",                         // see palette below
    color: "#06b6d4",                            // matches category palette
    description: "One-line palette tooltip.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  // Optional — declare any uniforms that read directly off node.config:
  static readonly uniformKeys = { strength: "float" } as const;

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const o = ctx.outputs.out;
    // … build expression …
    return { statements: `float ${o} = …;` };
  }
}

export default register(MyPrimitive);
```

### Naming

- **filename**: `kebab-case.ts`, matches `typeId`.
- **typeId**: `kebab-case`, stable identifier — never change after a primitive ships.
- **meta.name**: Title Case, mirrors Blender's display name (see canonical list in Rule 1).
- **class name**: PascalCase, mirrors `meta.name` without spaces.

### Category → palette color

Pick the color that matches the category. Do not introduce new colors.

| Category    | Color      | Examples                                   |
|-------------|------------|--------------------------------------------|
| `input`     | `#0ea5e9`  | time, mouse, screen-uv, resolution, sampler|
| `input`     | `#64748b`  | value (constants only)                     |
| `texture`   | `#06b6d4`  | gradient, voronoi, wave (procedural cyan)  |
| `texture`   | `#f97316`  | noise, grain, cell-grid (orange variants)  |
| `texture`   | `#22d3ee`  | magic, ripple                              |
| `texture`   | `#b45309`  | brick                                      |
| `vector`    | `#a78bfa`  | vector-math, mapping, projection, normal   |
| `vector`    | `#10b981`  | mask                                       |
| `converter` | `#a78bfa`  | math, map-range, smoothstep, threshold     |
| `color`     | `#ec4899`  | mix-color (blend ops)                      |
| `color`     | `#f59e0b`  | color-math, hsv↔rgb, color-ramp            |
| `group`     | `#94a3b8`  | group, reroute                             |
| `group`     | `#22c55e`  | group-input                                |

If the new primitive doesn't clearly fit, ask before picking a color.

### Pins — use the DSL, not raw Zod

Always use the pin helpers in `src/shaders/node-graph/pins.ts`:
`float`, `vec2`, `vec3`, `vec4`, `color`, `colorAlpha`, `vector2`, `vector3`, `uv`, `angle`, `bool`, `int`.

Each helper takes `(label, default)`. Pick the **most specific** helper — `color()` not `vec3()` for RGB, `uv()` not `vec2()` for coordinates, `angle()` not `float()` for radians. The subtype hint drives the inline editor and coercion behavior.

### `emit()` — write GLSL via string interpolation

- Read inputs from `ctx.inputs.<pinId>`, write to `ctx.outputs.<pinId>`.
- Read config via `this.cfg(ctx.config)` to get the typed `Config`.
- Read uniforms from `ctx.uniforms.<key>` (declared via `static uniformKeys`).
- Register GLSL helpers with `ctx.addDependency("hash22" /* etc */)` — see `src/shaders/core/types.ts` for the `GlslHelperName` union.
- Always declare each output as a local variable: `float ${o} = …;`.
- Keep the emitted GLSL **safe**: clamp denominators (`max(x, 1e-6)`), guard `pow` (`pow(max(x, 0.0), n)`), guard `sqrt`/`log` against negatives.

### Config-dependent pins (advanced)

If the pin set varies with config (like `Math`'s unary/binary/ternary), override `inputs(cfg)` / `outputs(cfg)` directly and skip the `static pins` declaration. Also override `displayTitle(cfg)` and optionally `glyph(cfg)` so the node renders with op-specific text. See `math.ts` for the reference.

## Step 4 — Wire it in and verify

1. Add the import to `src/shaders/node-graph/primitives/index.ts` under the matching category section. Preserve alphabetical-ish order within the section.
2. If the primitive is intended to appear in a smoke test, add a case to `scripts/smoke-new-primitives.ts`.
3. Run `bun run scripts/smoke-new-primitives.ts` (or the relevant smoke script) to confirm it emits non-empty GLSL.
4. Run typecheck: `bun run check` (or whichever the project uses — confirm via `package.json` scripts).

## Step 5 — Report back

When done, briefly summarize:
- the new primitive's `typeId`, category, and one-line purpose,
- any pushback you raised during the interview and how it was resolved,
- the verification commands you ran and their results.

## Reference primitives by archetype

When in doubt, copy the closest existing primitive and adapt:

| Archetype                          | Reference file                  |
|------------------------------------|---------------------------------|
| Pure scalar/vector math with op    | `math.ts`, `vector-math.ts`     |
| Procedural texture with variants   | `gradient-texture.ts`, `voronoi-texture.ts` |
| Texture with uniforms              | `noise-texture.ts`, `wave-texture.ts` |
| Color blend/transform              | `mix-color.ts`, `color-math.ts` |
| Coordinate transform               | `mapping.ts`, `projection.ts`   |
| Mask / shape                       | `mask.ts`                       |
| Sampler / multi-tap                | `sampler.ts`                    |
| Loop / iteration                   | `loop.ts`                       |
| Input source                       | `time.ts`, `screen-uv.ts`       |
