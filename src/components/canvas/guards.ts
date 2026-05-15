import type { NodeClass } from "@/shaders/core/node.svelte";
import type { NodeClassWithSpatialControls } from "@/shaders/core/spatial";

export function hasSpatialControls(
  cls: NodeClass,
): cls is NodeClassWithSpatialControls {
  return cls.spatialControls != null;
}
