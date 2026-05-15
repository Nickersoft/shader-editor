---
name: new-shader
description: Author a new shader (procedural preset) under src/shaders/textures using the PresetGraphBuilder. Composes existing primitives into a graph that matches a visual reference. Use when the user asks to "add a shader", "add a preset", "build a new effect", "create a shader from this image/video", or invokes /new-shader.
---

<!-- cSpell:words PresetGraphBuilder GLSL fbm Voronoi colorRamp screenUv polarTransform polarDomain truchet godrays -->

# New Shader

You are authoring a new shader preset in this project. Shaders are *graphs of primitives* assembled with `PresetGraphBuilder`, registered in `src/shaders/textures/procedural-presets.ts`, and rendered through the `ProceduralField` layer at runtime. This skill encodes the strict rules every new shader must follow.

## Step 1 — Always begin by interviewing the user

Before reading any code or proposing a structure, gather these four pieces of information. Use the `AskUserQuestion` tool for any the user has not already volunteered.

1. **Visual reference** — an image, video, GIF, screenshot, link to a CodePen / Shadertoy, or another preset in the editor. Without a reference you cannot honour Rule 3 ("match the reference closely"); refuse to proceed until one is provided.
2. **Desired parameters** — what knobs should the user be able to tweak in the editor? (e.g. `speed`, `scale`, `colorA`/`colorB`, `softness`). These become `groupInput` pins.
3. **Editor-specific configs** — anything beyond the visual that affects how the layer behaves: blend mode hints, expected aspect ratio, whether it composites onto a background (alpha output), tiling/seamless requirement, etc.
4. **Animations** — what moves over time, and how fast? Constant drift? Pulsing? Per-element jitter? "Static" is a valid answer; capture it explicitly so you don't accidentally wire `time`.

If a piece is genuinely not applicable, have the user say so explicitly — do not assume.

## Step 2 — Build the shader as a graph of *existing* primitives

This is the central rule. **In nearly all cases, a new shader is a new graph, not a new primitive.**

### Rule 1 — Compose, don't author

- Read `src/shaders/node-graph/primitives/index.ts` and the `PresetGraphBuilder` API in `src/shaders/textures/preset-graphs/builders.ts` *before* designing.
- Existing primitives cover: `gradient-texture`, `noise-texture` (perlin/fbm/simplex/worley), `voronoi-texture`, `wave-texture`, `magic-texture`, `brick-texture`, `cell-grid`, `mask`, `sampler`, `pixelate`, `grain`, `loop`, plus the full converter/vector/color toolbox (`math`, `vector-math`, `mix-color`, `color-ramp`, `map-range`, `smoothstep`, `mapping`, `projection`, etc.). The builder also exposes higher-level helpers — `polarTransform`, `polarDomain`, `colorRamp`, `fieldTransform`, `screenUv`, `position`, `time`.
- Voice complications as you encounter them: missing pin types, awkward coercions, or geometry the existing primitives cannot express cleanly.

### Rule 2 — If a new primitive is genuinely required

If — and only if — the visual cannot be reasonably approximated with existing primitives:

1. **Stop.** Do not start writing primitive code mid-flow.
2. Read `.claude/skills/new-primitive/SKILL.md` end-to-end. It carries the Blender-parity, atomicity, and dropdown-variant rules that govern every new primitive.
3. **Propose the new primitive to the user before proceeding.** State: what it would do, why no composition of existing primitives suffices, what name/category it would take from the Blender shader-node taxonomy, and which existing primitive it most resembles. Wait for explicit approval.
4. Only after approval, follow the new-primitive skill to author it; then return here to wire it into the shader graph.

Adding a primitive is a much bigger commitment than adding a shader. The bar is high. Default to "no, I can express this as a graph" until proven otherwise.

### Rule 3 — Match the visual reference as closely as possible

The reference is the spec. "Roughly similar" is not the goal — the goal is that a viewer comparing the rendered shader to the reference would call them the same effect.

- If a colour appears in the reference, sample it (eyedropper, screenshot a swatch) and bake it into the preset's default `colorA`/`colorB`/etc.
- If motion appears, match its character (linear drift vs. pulse vs. breathing) and its tempo. When unsure, prototype both and ask the user to pick.
- If the reference has multiple visual components (e.g. a glow *plus* a grain overlay), build them as separate sub-graphs and composite with `mix-color` or `math:mul`/`add` — do not collapse them into one mystery node.
- When the reference has detail you cannot reproduce within the primitive set, *say so* before shipping. Do not silently approximate and call it done.

## Step 3 — Author the preset file

### File location and shape

Each shader lives at `src/shaders/textures/<id>.ts` and exports a default `ProceduralPreset`:

```ts
import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "my-shader",                                          // kebab-case, unique
  name: "My Shader",                                        // Title Case display label
  description: "One-line blurb — Procedural Field preset",
  color: "#22ee88",                                         // palette tile colour
  graph: () => {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "speed",  type: "float", label: "Speed",  default: 0.5 },
      { id: "colorA", type: "vec3",  label: "Color A", default: [1, 1, 1] },
      // …more pins…
    ]);
    const p = b.position();   // texture-coordinate
    const t = b.time();       // global time

    // …compose primitives via b.add(...) and b.connect(...)…

    const out = b.add("mix-color", {});
    // …wire into out…
    return b.output(out);     // wires `out` into GroupOutput.color
    // For composited-onto-background presets, also pass alpha:
    // return b.output(color, alpha);
  },
} satisfies ProceduralPreset;
```

### Builder cheat-sheet

| Need | Call |
|------|------|
| Declare layer-editable parameters | `b.groupInput([{ id, type, label, default }, ...])` |
| Sample position (`vec2`) | `b.position()` |
| Sample raw screen UV (`vec2` in [0,1]²) | `b.screenUv()` |
| Sample time (`float`) | `b.time()` |
| Add a primitive | `b.add(typeId, configObject, optionalInlinePinValues, optionalOutPinName)` |
| Wire `from` → `to.pin` | `b.connect(from, toNodeId, "pin")` |
| Wire most recent node | `b.connectInto(from, "pin")` |
| Visual grouping (Frame) | `b.frame("Label", "#color", () => { /* nodes */ })` |
| Polar `(r, θ01)` from p around centre | `b.polarTransform(p, center)` |
| Polar `(r·rs, θ·as)` domain | `b.polarDomain(p, rScale, aScale)` |
| Multi-stop colour ramp | `b.colorRamp(domain, [[r,g,b], ...])` |
| Scale + offset position, scale time | `b.fieldTransform(p, t, { scale, speed, seed })` |
| Terminate graph | `b.output(color)` or `b.output(color, alpha)` |

### Conventions

- **Inline literals via the third `add()` argument** — when a math node needs a constant on one of its pins (e.g. `b.add("math", { op: "mul" }, { b: 6.2831853 })`), bake it inline rather than spawning a `value` node. Reserve `value` for constants that are genuinely shared across consumers or are conceptually parameters.
- **Comment the maths above each cluster.** The reader should be able to trace `// rad = r0 * (1 + warp * def)` straight to the three nodes that compute it. See `blob.ts` for the gold-standard commented preset.
- **Use `frame()` to visually cluster related nodes** — polar transforms, FBM stacks, ramp lookups. Frames make the saved graph navigable in the editor.
- **Defaults must look good unconfigured.** A user dropping the preset onto a new layer should see something close to the reference *immediately*; the parameter pins are for variation, not for "you must configure this before it works".
- **Coercion is implicit at edges.** A `float` wired into a `vec2` pin broadcasts as `vec2(x)`; a `vec3` wired into a `float` collapses via length or luminance depending on subtype. You usually don't need explicit `combine-xy` / `separate-xy` glue — but add them when the readability benefit outweighs the node count.

### Register the preset

Add three lines to `src/shaders/textures/procedural-presets.ts`:
1. `import myShader from "./my-shader";` (alphabetised with the others).
2. Append `myShader` to the `PROCEDURAL_PRESETS` array.

## Step 4 — Verify in the browser with agent-browser

A shader is only done when you have *seen* it render and compared it to the reference. Type-checking and smoke tests verify code correctness, not visual correctness.

1. Start the dev server: `bun run dev` (or check `package.json` for the actual script — currently `vite dev`). Run it in the background.
2. Navigate to the dev URL with `agent-browser open <url>` (typically `http://localhost:5173`).
3. Get an interactive snapshot (`agent-browser snapshot -i`) and click the controls needed to:
   - create a new layer,
   - select your preset from the procedural-field preset picker,
   - exercise each parameter slider through its range.
4. Take screenshots at default settings and at parameter extremes. **Compare side-by-side with the visual reference.**
5. If animations were specified, capture two screenshots a few seconds apart to confirm motion is present and roughly matches the reference's tempo.
6. Iterate. If the rendered output does not match, do not call the task done — adjust the graph, defaults, or (after the gating discussion in Rule 2) propose a new primitive.

If `agent-browser` is unavailable or the page cannot be reached, **say so explicitly** rather than claiming visual confirmation. The user can validate manually, but the lack of verification must be surfaced.

## Step 5 — Report back

When done, briefly summarise:
- the new shader's `id`, the parameters it exposes, and the primitives it composes;
- any complications you raised during composition (missing primitives, awkward coercions) and how they were resolved;
- whether a new primitive was authored (and why), with a link to its file;
- the verification you ran (screenshots taken, comparison to reference) — and any divergences you could not close.

## Reference shaders by archetype

When in doubt, copy the closest existing preset and adapt:

| Archetype                              | Reference file                                   |
|----------------------------------------|--------------------------------------------------|
| Single-node texture wrapper            | `aurora.ts`, `magic.ts`, `voronoi.ts`            |
| Multi-stop gradient                    | `multi-point-gradient.ts`, `radial-gradient.ts`  |
| Polar / radial composition             | `blob.ts`, `spiral.ts`, `swirl.ts`               |
| FBM / noise stack                      | `branched-noise.ts`, `plasma.ts`, `flowing-gradient.ts` |
| Tiled / grid pattern                   | `checkerboard.ts`, `dot-grid.ts`, `hex-grid.ts`, `weave.ts` |
| Animated streaks                       | `falling-lines.ts`, `godrays.ts`, `beam.ts`      |
| Composite onto background (alpha out)  | `aurora.ts`, `floating-particles.ts`, `strands.ts` |
| Solid / minimal                        | `solid-color.ts`, `gradient.ts`                  |
