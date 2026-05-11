// Top-level barrel for the authoring layer.
//
// Each primitive file under <category>/ registers its class with the global
// Registry by importing `register` and calling it at module load. This file
// imports each category barrel (transitively, every primitive) so a single
// `import '@/shaders'` is enough to populate the registry.
//
// Categories mirror the bucketing at shaders.com/docs/components.

export * from "./core";

import "./textures";
import "./shapes";
import "./shape-effects";
import "./stylize";
import "./interactive";
import "./distortion";
import "./blurs";
import "./adjustments";
