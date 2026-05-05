// ShaderChain — the linear, ordered sequence of nodes that the codegen
// compiles into a runnable shader.
//
// Authored either imperatively via the editor (drag-reorder a layer stack) or
// declaratively via presets (`chain().pipe(new Heatmap(...)).pipe(new Blur(...))`).

import { deserializeNode } from './registry'
import type { Node } from './node'
import type { SerializedChain, SerializedNode } from './types'

export class ShaderChain {
  nodes: Node[]

  constructor(nodes: Node[] = []) {
    this.nodes = nodes
  }

  /** Append a node. Returns the chain for fluent composition. */
  pipe(node: Node): ShaderChain {
    this.nodes.push(node)
    return this
  }

  /** Insert a node at a specific position. */
  insert(index: number, node: Node): ShaderChain {
    this.nodes.splice(index, 0, node)
    return this
  }

  /** Remove a node by instance id. No-op if not found. */
  remove(id: string): ShaderChain {
    const idx = this.nodes.findIndex((n) => n.id === id)
    if (idx >= 0) this.nodes.splice(idx, 1)
    return this
  }

  /** Move a node to a new index in the chain. */
  reorder(id: string, newIndex: number): ShaderChain {
    const idx = this.nodes.findIndex((n) => n.id === id)
    if (idx < 0) return this
    const [node] = this.nodes.splice(idx, 1)
    this.nodes.splice(newIndex, 0, node)
    return this
  }

  /** Find a node by instance id. */
  find(id: string): Node | undefined {
    return this.nodes.find((n) => n.id === id)
  }

  /** Enabled nodes in render order. */
  get enabled(): Node[] {
    return this.nodes.filter((n) => n.enabled)
  }

  toJSON(): SerializedChain {
    return { nodes: this.nodes.map((n) => n.toJSON()) }
  }

  static fromJSON(json: SerializedChain): ShaderChain {
    return new ShaderChain(json.nodes.map((n: SerializedNode) => deserializeNode(n)))
  }

  /** Shallow clone — useful when handing the chain to React state. */
  clone(): ShaderChain {
    return ShaderChain.fromJSON(this.toJSON())
  }
}

/** Fluent constructor. */
export function chain(...initial: Node[]): ShaderChain {
  return new ShaderChain(initial)
}
