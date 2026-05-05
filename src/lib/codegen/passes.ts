// Pass splitting. Walks `chain.enabled` and partitions nodes into render
// passes:
//   - A run of GeneratorNodes collapses into one pass (one fragment shader,
//     N nodes blended together).
//   - Each EffectNode triggers an FBO split: it becomes its own pass that
//     reads the previous pass via `u_prevPass` (bound as `vec4 prev`).
//   - Each ProcessingNode emits two passes: a degenerate JS pass (the runtime
//     binds the node's CPU-computed output as `u_<prefix>_jsOutput` and the
//     fragment program just samples it through), then optionally a follow-on
//     `glsl-render` pass running the node's `glsl()` block.

import {
  EffectNode,
  GeneratorNode,
  ProcessingNode,
  type Node,
} from '@/shaders/core/node'

export interface PassPlan {
  nodes: Node[]
  readsPrevPass: boolean
  // 'js' = degenerate fragment pass that samples a ProcessingNode's CPU output.
  // 'glsl-render' = ProcessingNode's follow-on render phase using its own glsl().
  // Otherwise a normal GLSL pass containing one or more Generator/Effect nodes.
  mode?: 'js' | 'glsl-render'
}

export function splitIntoPasses(nodes: Node[]): PassPlan[] {
  const plans: PassPlan[] = []
  let current: Node[] = []
  let isReader = false

  const closeCurrent = () => {
    if (current.length > 0) {
      plans.push({ nodes: current, readsPrevPass: isReader })
      current = []
      isReader = false
    }
  }

  for (const node of nodes) {
    if (node instanceof ProcessingNode) {
      // Boundary: close any GeneratorNode run before us.
      closeCurrent()
      // Emit the JS pass (samples u_<prefix>_jsOutput).
      plans.push({ nodes: [node], readsPrevPass: false, mode: 'js' })
      // Follow-on GLSL render pass if the ProcessingNode provides one.
      if (typeof node.glsl === 'function') {
        plans.push({ nodes: [node], readsPrevPass: true, mode: 'glsl-render' })
      }
      // Subsequent nodes start a fresh accumulator that reads our output.
      isReader = true
      continue
    }

    if (node instanceof EffectNode) {
      // Boundary: close any GeneratorNode run before us, then this EffectNode
      // becomes its own pass that reads the previous output.
      closeCurrent()
      plans.push({ nodes: [node], readsPrevPass: true })
      isReader = true
      continue
    }

    if (node instanceof GeneratorNode) {
      current.push(node)
      continue
    }

    // Unknown node type — skip.
  }

  closeCurrent()

  // Drop a leading empty pass (would only happen if the very first node is a
  // boundary with nothing below it; the runtime supplies a transparent prev
  // pass automatically).
  if (plans.length > 1 && plans[0].nodes.length === 0) plans.shift()
  return plans
}
