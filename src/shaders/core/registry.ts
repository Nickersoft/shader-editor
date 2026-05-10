// Type-id → class registry.
//
// Every primitive class registers itself by typeId so the chain loader can
// reconstruct nodes from `SerializedNode` JSON. Registration is automatic
// when a primitive file is imported (the primitive's index file imports each
// class file, which calls `register(MyClass)` at module load).

import type { Node, NodeClass } from './node.svelte'
import type { Category, SerializedNode } from './types'

const REGISTRY = new Map<string, NodeClass>()

export function register<T extends Node>(cls: NodeClass<T>): NodeClass<T> {
  if (!cls.typeId) {
    throw new Error(`Cannot register class ${cls.name}: missing static typeId`)
  }
  if (REGISTRY.has(cls.typeId)) {
    const existing = REGISTRY.get(cls.typeId)!
    if (existing !== cls) {
      throw new Error(
        `Duplicate Node typeId "${cls.typeId}" — already registered to ${existing.name}, attempted by ${cls.name}`,
      )
    }
  }
  REGISTRY.set(cls.typeId, cls as NodeClass)
  return cls
}

export function getNodeClass(typeId: string): NodeClass | undefined {
  return REGISTRY.get(typeId)
}

export function listNodeClasses(): NodeClass[] {
  return Array.from(REGISTRY.values())
}

export function listByCategory(category: Category): NodeClass[] {
  return listNodeClasses().filter((c) => c.meta.category === category)
}

/**
 * Hydrate a serialized node into a class instance. Throws if the typeId is
 * unregistered (e.g. a save file references a primitive that's been renamed
 * or removed).
 */
export function deserializeNode(json: SerializedNode): Node {
  const cls = REGISTRY.get(json.typeId)
  if (!cls) {
    throw new Error(`Unknown node typeId "${json.typeId}" (instance id: ${json.id})`)
  }
  return new cls({
    id: json.id,
    config: json.config,
    inputs: json.inputs,
    blendMode: json.blendMode,
    opacity: json.opacity,
    enabled: json.enabled,
  })
}
