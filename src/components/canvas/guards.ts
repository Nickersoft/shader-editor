import type { ShaderClass } from "@/shaders/core/shader.svelte";
import type { ShaderClassWithSpatialControls } from "@/shaders/core/spatial";

export function hasSpatialControls(
  cls: ShaderClass,
): cls is ShaderClassWithSpatialControls {
  return cls.spatialControls != null;
}
