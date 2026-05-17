// Pass splitting. Walks a flat shader list and partitions it into render
// passes:
//   - A run of generator Shaders collapses into one pass (one fragment shader,
//     N shaders blended together).
//   - Each Effect triggers an FBO split: it becomes its own pass that
//     reads the previous pass via `u_prevPass` (bound as `vec4 prev`).
//   - Each ProcessingShader (a Shader with a `preprocess()` hook) emits two
//     passes: a degenerate JS pass (the runtime binds the shader's
//     CPU-computed output as `u_<prefix>_jsOutput` and the fragment program
//     just samples it through), then optionally a follow-on `glsl-render`
//     pass running the shader's `glsl()` block.

import {
  Effect,
  isGenerator,
  isProcessingShader,
  type Shader,
} from "@/shaders/core/shader.svelte";

export interface PassPlan {
  nodes: Shader[];
  readsPrevPass: boolean;
  // 'js' = degenerate fragment pass that samples a ProcessingShader's CPU output.
  // 'glsl-render' = ProcessingShader's follow-on render phase using its own glsl().
  // 'compositor' = scene compositor that blends layer textures via u_layer_*.
  // Otherwise a normal GLSL pass containing one or more generator/Effect shaders.
  mode?: "js" | "glsl-render" | "compositor";
  // For Effects whose `glsl()` returns multiple blocks (multi-pass effects
  // like separable blurs), this is the index into that block array. Undefined
  // / 0 means "the first / only block." Each multi-block pass after the first
  // is implicitly `readsPrevPass: true`.
  blockIndex?: number;
  // When set, the runtime renders this pass into the per-layer texture pool
  // at `layerTextures[commitToLayer]`. Used to terminate a Layer's mini-chain.
  commitToLayer?: number;
  // When true (set on the compositor pass) the runtime intrinsically binds
  // each `u_layer_<i>` sampler to the matching layer texture.
  bindLayerTextures?: boolean;
}

export function splitIntoPasses(nodes: Shader[]): PassPlan[] {
  const plans: PassPlan[] = [];
  let current: Shader[] = [];
  let isReader = false;

  const closeCurrent = () => {
    if (current.length > 0) {
      plans.push({ nodes: current, readsPrevPass: isReader });
      current = [];
      isReader = false;
    }
  };

  for (const node of nodes) {
    if (isProcessingShader(node)) {
      // Boundary: close any generator run before us.
      closeCurrent();
      // Emit the JS pass (samples u_<prefix>_jsOutput).
      plans.push({ nodes: [node], readsPrevPass: false, mode: "js" });
      // Follow-on GLSL render pass if the ProcessingShader provides one.
      if (typeof node.glsl === "function") {
        plans.push({ nodes: [node], readsPrevPass: true, mode: "glsl-render" });
      }
      // Subsequent nodes start a fresh accumulator that reads our output.
      isReader = true;
      continue;
    }

    if (node instanceof Effect) {
      // Boundary: close any generator run before us. Effects whose glsl()
      // returns multiple blocks expand to one pass per block; each pass
      // after the first reads the previous block's output.
      closeCurrent();
      const out = node.glsl();
      const blocks = Array.isArray(out) ? out : [out];
      for (let i = 0; i < blocks.length; i++) {
        plans.push({ nodes: [node], readsPrevPass: true, blockIndex: i });
      }
      isReader = true;
      continue;
    }

    if (isGenerator(node)) {
      current.push(node);
      continue;
    }

    // Unknown shader type — skip.
  }

  closeCurrent();

  // Drop a leading empty pass (would only happen if the very first node is a
  // boundary with nothing below it; the runtime supplies a transparent prev
  // pass automatically).
  if (plans.length > 1 && plans[0].nodes.length === 0) plans.shift();
  return plans;
}
