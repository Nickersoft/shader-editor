// Debug helper: dump the emitted fragment GLSL for a preset.
// Run with: bun scripts/dump-preset.ts <preset-id>

import { emitGraph } from "@/shaders/node-graph";
import { getProceduralPreset } from "@/shaders/textures/procedural-presets";

const id = process.argv[2] ?? "blob";
const preset = getProceduralPreset(id);
if (!preset) {
  console.error(`No preset: ${id}`);
  process.exit(1);
}
const graph = preset.graph();
const e = emitGraph(graph, { containerPrefix: "x" });
console.log("=== Uniforms ===");
for (const u of e.uniforms) console.log(`u_x_${u.nameSuffix}: ${u.type}`);
console.log("\n=== Main ===");
console.log(e.main);
console.log("\n=== Deps ===");
console.log(e.dependencies);
