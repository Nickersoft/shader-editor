// Type-id → class registry.
//
// Every primitive class registers itself by typeId so the chain loader can
// reconstruct nodes from `SerializedNode` JSON. Registration is automatic
// when a primitive file is imported (the primitive's index file imports each
// class file, which calls `register(MyClass)` at module load).

import type { Node, NodeClass, SerializedNode } from "./node.svelte";
import type { Category } from "./types";

const REGISTRY = new Map<string, NodeClass>();

export function register<T extends Node>(cls: NodeClass<T>): NodeClass<T> {
  if (!cls.typeId) {
    throw new Error(`Cannot register class ${cls.name}: missing static typeId`);
  }
  // Always overwrite on re-registration. The static `typeId` is the durable
  // identity — Vite HMR hands us a new class reference for the same typeId
  // when a module is hot-reloaded, and throwing would brick the editor on
  // every save. Cross-class typeId collisions would still be caught by code
  // review since name + module path are obvious.
  REGISTRY.set(cls.typeId, cls as NodeClass);
  return cls;
}

export function getNodeClass(typeId: string): NodeClass | undefined {
  return REGISTRY.get(typeId);
}

export function listNodeClasses(): NodeClass[] {
  return Array.from(REGISTRY.values());
}

export function listByCategory(category: Category): NodeClass[] {
  return listNodeClasses().filter((c) => c.meta.category === category);
}

/**
 * Hydrate a serialized node into a class instance. Throws if the typeId is
 * unregistered (e.g. a save file references a primitive that's been renamed
 * or removed).
 */
export function deserializeNode(json: SerializedNode): Node {
  const cls = REGISTRY.get(json.typeId);
  if (!cls) {
    throw new Error(`Unknown node typeId "${json.typeId}" (instance id: ${json.id})`);
  }
  // `inputs` is forwarded so legacy serialized scenes still hydrate — the
  // Node constructor merges it into the parse pool alongside `config` and
  // `uniforms`. Cast through unknown because the current SerializedNode
  // type omits the deprecated `inputs` key.
  const legacyInputs = (json as unknown as { inputs?: Record<string, unknown> }).inputs;
  return new cls({
    id: json.id,
    config: json.config,
    uniforms: json.uniforms,
    inputs: legacyInputs,
    blendMode: json.blendMode,
    opacity: json.opacity,
    enabled: json.enabled,
  });
}
