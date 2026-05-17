// Type-id → class registry.
//
// Every Shader subclass registers itself by typeId so the scene loader can
// reconstruct instances from `SerializedShader` JSON. Registration is
// automatic when a shader file is imported (each category's index file
// imports each class file, which calls `register(MyClass)` at module load).

import type { Shader, ShaderClass, SerializedShader } from "./shader.svelte";
import type { Category } from "./types";

const REGISTRY = new Map<string, ShaderClass>();

export function register<T extends Shader>(cls: ShaderClass<T>): ShaderClass<T> {
  if (!cls.typeId) {
    throw new Error(`Cannot register class ${cls.name}: missing static typeId`);
  }
  // Always overwrite on re-registration. The static `typeId` is the durable
  // identity — Vite HMR hands us a new class reference for the same typeId
  // when a module is hot-reloaded, and throwing would brick the editor on
  // every save.
  REGISTRY.set(cls.typeId, cls as ShaderClass);
  return cls;
}

export function getShaderClass(typeId: string): ShaderClass | undefined {
  return REGISTRY.get(typeId);
}

export function listShaderClasses(): ShaderClass[] {
  return Array.from(REGISTRY.values());
}

export function listByCategory(category: Category): ShaderClass[] {
  return listShaderClasses().filter((c) => c.meta.category === category);
}

/**
 * Hydrate a serialized shader into a class instance. Throws if the typeId is
 * unregistered (e.g. a save file references a primitive that's been renamed
 * or removed).
 */
export function deserializeShader(json: SerializedShader): Shader {
  const cls = REGISTRY.get(json.typeId);
  if (!cls) {
    throw new Error(`Unknown shader typeId "${json.typeId}" (instance id: ${json.id})`);
  }
  return new cls(json);
}
