// Per-pass fragment-shader emission.
//
// For a normal pass: collects the GLSL block from each contributing shader,
// emits utility-function dependencies, layer wrappers, and a `main()` that
// blends each layer onto the running color.
//
// For a 'js' pass: emits a degenerate program that samples the
// ProcessingShader's CPU-computed output texture (`u_<prefix>_jsOutput`)
// and writes it through with the shader's opacity applied.
//
// For a 'glsl-render' pass: same code path as a normal Effect pass, but
// the layer's `glsl()` block was provided by a ProcessingShader that
// consumes `u_prevPass` (the preprocessed image).

import { Effect, type Shader, type StaticShaderClass } from "@/shaders/core/shader.svelte";

import { BLEND_MODE_FUNCTIONS } from "./blend-modes";
import { GLSL_HELPERS as GLSL_UTILS } from "./helpers";
import type { PassPlan } from "./passes";
import { inspectObjectSchema } from "./schema-introspection";
import type { GeneratedPass } from "./types";
import type { Layer } from "@/shaders/core/scene.svelte";

interface BuildContext {
  // Whether any node in the chain references a structured-UV varying (v_objectUV
  // etc.). Drives the vertex-shader variant.
  usesStructuredUv: boolean;
}

export function buildFragment(plan: PassPlan, _ctx: BuildContext): GeneratedPass {
  if (plan.mode === "js") return buildJsFragment(plan);
  return buildGlslFragment(plan);
}

/**
 * One compositor input. `parentIndex`, when set, references another entry in
 * the same array — the child's RGBA is multiplied by the parent's alpha
 * before blending, giving Figma-style clipping-mask semantics ("texture
 * inside shape").
 */
export interface CompositorLayerSpec {
  layer: Layer;
  parentIndex: number | null;
}

/**
 * Compositor fragment for the Scene model. Samples one texture per enabled
 * Layer (`u_layer_<i>`) and blends them in render order onto a clear base
 * using each layer's blendMode + opacity. Background color comes in via
 * `u_sceneBackground`.
 *
 * Clipping-mask children (`spec.parentIndex !== null`) multiply the child's
 * sample alpha by the parent layer's alpha (sampled from `u_layer_<parent>`)
 * before blending. Only that one child is clipped — not everything beneath
 * it.
 */
export function buildCompositorFragment(specs: CompositorLayerSpec[]): GeneratedPass {
  const blendModes = new Set<string>(["normal"]);
  for (const s of specs) blendModes.add(s.layer.blendMode);
  const dependencies = new Set<string>();
  for (const m of blendModes) {
    const fn = BLEND_MODE_FUNCTIONS[m as keyof typeof BLEND_MODE_FUNCTIONS];
    if (fn) dependencies.add(fn);
  }
  expandTransitiveDeps(dependencies);
  const sortedDeps = sortDependencies(Array.from(dependencies));
  const utilFunctions: string[] = [];
  for (const dep of sortedDeps) {
    if (GLSL_UTILS[dep]) utilFunctions.push(GLSL_UTILS[dep].code);
  }

  const uniformDeclarations: string[] = [
    "uniform vec2 u_resolution;",
    "uniform vec4 u_sceneBackground;",
  ];
  for (let i = 0; i < specs.length; i++) {
    uniformDeclarations.push(`uniform sampler2D u_layer_${i};`);
    uniformDeclarations.push(`uniform float u_layer_${i}_opacity;`);
  }

  const layerCalls: string[] = [];
  layerCalls.push(`  vec4 color = u_sceneBackground;`);
  for (let i = 0; i < specs.length; i++) {
    const { layer, parentIndex } = specs[i];
    const blendFn = BLEND_MODE_FUNCTIONS[layer.blendMode] || "blendNormal";
    if (parentIndex !== null) {
      // Clipping-mask child: gate this layer's contribution by the parent
      // layer's alpha, then blend normally. Only this layer is clipped — not
      // anything else below. Gate alpha only — RGB stays intact so the blend
      // functions (which interpolate by `blend.a`) cleanly fade the clipped
      // contribution to zero outside the parent shape and pass it through
      // unchanged inside.
      layerCalls.push(
        `  {
    vec4 _src = texture(u_layer_${i}, v_uv);
    _src.a *= texture(u_layer_${parentIndex}, v_uv).a;
    color = ${blendFn}(color, _src, u_layer_${i}_opacity);
  }`,
      );
    } else {
      layerCalls.push(
        `  color = ${blendFn}(color, texture(u_layer_${i}, v_uv), u_layer_${i}_opacity);`,
      );
    }
  }

  const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// Uniforms
${uniformDeclarations.join("\n")}

// Utility Functions
${utilFunctions.join("\n")}

void main() {
${layerCalls.join("\n")}
  fragColor = color;
}
`;

  return {
    fragmentShader,
    readsPrevPass: false,
    nodeIds: [],
    mode: "compositor",
    bindLayerTextures: true,
  };
}

function buildJsFragment(plan: PassPlan): GeneratedPass {
  const node = plan.nodes[0];
  const prefix = node.prefix;
  const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_${prefix}_jsOutput;
uniform float u_${prefix}_opacity;

void main() {
  vec4 c = texture(u_${prefix}_jsOutput, v_uv);
  fragColor = vec4(c.rgb, c.a * u_${prefix}_opacity);
}
`;
  return {
    fragmentShader,
    readsPrevPass: false,
    nodeIds: [node.id],
    mode: "js",
  };
}

function buildGlslFragment(plan: PassPlan): GeneratedPass {
  const { nodes, readsPrevPass, mode, blockIndex } = plan;
  const dependencies = new Set<string>();
  const blendModes = new Set<string>();

  // Collect dependencies and blend modes.
  for (const node of nodes) {
    const block = getGlslBlock(node, blockIndex);
    if (!block) continue;
    const deps =
      typeof block.dependencies === "function"
        ? block.dependencies(node.inputs as Record<string, unknown>)
        : (block.dependencies ?? []);
    deps.forEach((d) => dependencies.add(d));
    if (node.blendMode !== "normal") blendModes.add(node.blendMode);
  }
  blendModes.add("normal");
  for (const mode of blendModes) {
    const fn = BLEND_MODE_FUNCTIONS[mode as keyof typeof BLEND_MODE_FUNCTIONS];
    if (fn) dependencies.add(fn);
  }

  // Walk transitive dependencies. Each helper in GLSL_UTILS declares its own
  // upstream needs, so callers only have to list helpers they reference
  // directly. The closure is bounded by the GLSL_UTILS keys.
  expandTransitiveDeps(dependencies);

  // Uniform declarations.
  const uniformDeclarations: string[] = ["uniform float u_time;", "uniform vec2 u_resolution;"];
  if (readsPrevPass) {
    uniformDeclarations.push("uniform sampler2D u_prevPass;");
  }

  // Optional global uniforms — declared only if any node in this pass
  // references them. The runtime always binds them when the location resolves;
  // declaring conditionally keeps unused programs clean.
  const allBlocks = nodes
    .map((n) => getGlslBlock(n, blockIndex))
    .filter((b): b is NonNullable<ReturnType<typeof getGlslBlock>> => !!b);
  const passBody = allBlocks.map((b) => b.main + (b.functions ?? "")).join("\n");
  if (/\bu_mouse\b/.test(passBody)) {
    uniformDeclarations.push("uniform vec2 u_mouse;");
  }
  if (/\bu_mouseDelta\b/.test(passBody)) {
    uniformDeclarations.push("uniform vec2 u_mouseDelta;");
  }
  if (/\bu_prevFrame\b/.test(passBody)) {
    uniformDeclarations.push("uniform sampler2D u_prevFrame;");
  }
  if (/\bu_noiseTexture\b/.test(passBody)) {
    uniformDeclarations.push("uniform sampler2D u_noiseTexture;");
  }

  for (const node of nodes) {
    const prefix = node.prefix;
    uniformDeclarations.push(`uniform float u_${prefix}_opacity;`);

    const cls = node.cls as StaticShaderClass;
    // ProceduralShader/ProceduralEffect have no static schema — they emit
    // their uniforms via `extraUniforms()` instead. Only iterate schema
    // fields when the class actually declares one.
    const uniformFields = cls.schema ? inspectObjectSchema(cls.schema) : [];

    for (const field of uniformFields) {
      const baseName = `u_${prefix}_${field.key}`;
      if (field.glslType === "sampler2D") {
        uniformDeclarations.push(`uniform sampler2D ${baseName};`);
        // _meta/_offset companions are emitted only when the layer's GLSL
        // actually references them. Cheap layers (e.g. raw sampler reads)
        // get a smaller program; image-domain layers (image-texture, video,
        // dom) keep both companions because their GLSL uses them.
        if (passBody.includes(`${baseName}_meta`)) {
          uniformDeclarations.push(`uniform vec4 ${baseName}_meta;`);
        }
        if (passBody.includes(`${baseName}_offset`)) {
          uniformDeclarations.push(`uniform vec2 ${baseName}_offset;`);
        }
      } else if (field.glslType === "vec4Array") {
        const len = field.arrayLength ?? 10;
        uniformDeclarations.push(`uniform vec4 ${baseName}[${len}];`);
        uniformDeclarations.push(`uniform int ${baseName}_count;`);
      } else {
        uniformDeclarations.push(`uniform ${field.glslType} ${baseName};`);
      }
    }

    // Container-shader extra uniforms (e.g. ProceduralShader graph stages).
    const extras = node.extraUniforms?.() ?? [];
    for (const extra of extras) {
      const baseName = `u_${prefix}_${extra.nameSuffix}`;
      if (extra.type === "sampler2D") {
        uniformDeclarations.push(`uniform sampler2D ${baseName};`);
      } else if (extra.type === "vec4Array") {
        const len = extra.arrayLength ?? 10;
        uniformDeclarations.push(`uniform vec4 ${baseName}[${len}];`);
        uniformDeclarations.push(`uniform int ${baseName}_count;`);
      } else {
        uniformDeclarations.push(`uniform ${extra.type} ${baseName};`);
      }
    }
  }

  // Utility functions.
  const sortedDeps = sortDependencies(Array.from(dependencies));
  const utilFunctions: string[] = [];
  for (const dep of sortedDeps) {
    if (GLSL_UTILS[dep]) utilFunctions.push(GLSL_UTILS[dep].code);
  }

  // Per-node helper functions and main() wrappers.
  const layerHelpers = new Set<string>();
  const layerFunctions: string[] = [];
  const mainCalls: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const block = getGlslBlock(node, blockIndex);
    if (!block) continue;
    if (block.functions) layerHelpers.add(block.functions.trim());

    const prefix = node.prefix;
    const funcName = `layer_${prefix}`;
    // The wrapper parameter is always named `base` so primitives can read
    // the running color (or the previous pass output, for effects) with the
    // same identifier regardless of node class. EffectNodes additionally
    // have `u_prevPass` available if they need texture-space sampling.
    layerFunctions.push(`
vec4 ${funcName}(vec2 uv, vec4 base) {
${indent(block.main.trim(), 2)}
}`);

    const blendFunc = BLEND_MODE_FUNCTIONS[node.blendMode] || "blendNormal";
    if (i === 0) {
      // Compose onto a transparent base so the layer's alpha is folded into
      // its RGB. Without this, fragments outside the shape carry the fill
      // color with alpha=0, which the canvas (alpha:false) displays as opaque.
      mainCalls.push(`  vec4 color = blendNormal(vec4(0.0), ${funcName}(uv, vec4(0.0)), 1.0);`);
    } else {
      mainCalls.push(`  color = ${blendFunc}(color, ${funcName}(uv, color), u_${prefix}_opacity);`);
    }
  }

  // Apply the first node's opacity at the end.
  if (nodes.length > 0) {
    const firstPrefix = nodes[0].prefix;
    mainCalls.push(`  color.a *= u_${firstPrefix}_opacity;`);
  }

  // Scan the emitted body for which structured-UV varyings are referenced,
  // and declare only those. The vertex shader auto-detects the same set
  // (see fragment-source scan in vertex.ts) so no varying mismatch can occur.
  const body = [
    utilFunctions.join("\n"),
    Array.from(layerHelpers).join("\n"),
    layerFunctions.join("\n"),
    mainCalls.join("\n"),
  ].join("\n");
  const varyingDeclarations = collectVaryings(body);

  const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
${varyingDeclarations}
out vec4 fragColor;

// Uniforms
${uniformDeclarations.join("\n")}

// Utility Functions
${utilFunctions.join("\n")}

// Layer Helpers
${Array.from(layerHelpers).join("\n")}

// Layer Functions
${layerFunctions.join("\n")}

void main() {
  vec2 uv = v_uv;

${mainCalls.length > 0 ? mainCalls.join("\n") : "  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);"}

  fragColor = color;
}
`;

  return {
    fragmentShader,
    readsPrevPass,
    nodeIds: nodes.map((n) => n.id),
    ...(mode ? { mode } : {}),
  };
}

function getGlslBlock(
  node: Shader,
  blockIndex = 0,
): import("@/shaders/core/types").GlslBlock | null {
  if (node instanceof Effect) {
    const out = node.glsl();
    return Array.isArray(out) ? (out[blockIndex] ?? null) : out;
  }
  // Generator shader (or ProcessingShader in glsl-render phase) — both return
  // a single GlslBlock from their (optional, for ProcessingShader) `glsl()`.
  if (typeof node.glsl !== "function") return null;
  const out = node.glsl();
  return Array.isArray(out) ? (out[blockIndex] ?? null) : out;
}

function indent(code: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

const STRUCTURED_VARYINGS = [
  "v_objectUV",
  "v_objectBoxSize",
  "v_responsiveUV",
  "v_responsiveBoxGivenSize",
  "v_patternUV",
  "v_patternBoxSize",
  "v_imageUV",
] as const;

function collectVaryings(body: string): string {
  const lines: string[] = [];
  for (const v of STRUCTURED_VARYINGS) {
    if (body.includes(v)) lines.push(`in vec2 ${v};`);
  }
  return lines.join("\n");
}

const DEP_ORDER: Record<string, number> = {
  hash: 0,
  hash2: 0,
  hash3: 0,
  pi: 0,
  remap: 0,
  rotate: 0,
  rotate2D: 0,
  rgb2hsv: 0,
  hsv2rgb: 0,
  hash21: 0,
  hash22: 0,
  valueNoise: 1,
  simplex2D: 1,
  fbm: 2,
  fiberNoise: 2,
  domainWarp: 2,
  voronoi: 2,
  snoise: 2,
  oklchTransforms: 2,
  oklchColorRampLookup: 3,
  luma: 0,
  colorBandingFix: 3,
  gaussian9: 4,
  gaussian13: 4,
  applyEdgeHandling: 4,
  unpremultiplyAlpha: 0,
  blendNormal: 3,
  blendAdd: 3,
  blendMultiply: 3,
  blendScreen: 3,
  blendOverlay: 3,
  blendSoftLight: 3,
  blendHardLight: 3,
};

function sortDependencies(deps: string[]): string[] {
  return deps.sort((a, b) => (DEP_ORDER[a] ?? 99) - (DEP_ORDER[b] ?? 99));
}

/** Walk each helper's `needs` transitively, mutating the set in place. */
function expandTransitiveDeps(deps: Set<string>) {
  const stack = Array.from(deps);
  while (stack.length > 0) {
    const dep = stack.pop()!;
    const entry = GLSL_UTILS[dep];
    if (!entry?.needs) continue;
    for (const upstream of entry.needs) {
      if (!deps.has(upstream)) {
        deps.add(upstream);
        stack.push(upstream);
      }
    }
  }
}
