// Quick verification: emit each preset's graph and ensure the result is
// non-trivial (has nodes, edges, a return statement). Doesn't run the GLSL
// through a compiler — that'd require a WebGL context — but catches the
// common failure modes (missing edges, GroupOutput unwired, primitives
// referencing unknown typeIds).

import { emitGraph } from "@/shaders/node-graph";
import { PROCEDURAL_PRESETS } from "@/shaders/textures/procedural-presets";

let pass = 0;
let fail = 0;
for (const preset of PROCEDURAL_PRESETS) {
  try {
    const graph = preset.graph();
    if (graph.nodes.length === 0) throw new Error("empty nodes");
    const out = graph.nodes.find((n) => n.typeId === "group-output");
    if (!out) throw new Error("missing group-output");
    const e = emitGraph(graph, { containerPrefix: "x" });
    if (!e.main.includes("return vec4(")) throw new Error("no return in main");
    console.log(`OK  ${preset.id}: ${graph.nodes.length} nodes, ${graph.edges.length} edges, deps=[${e.dependencies.join(",")}]`);
    pass++;
  } catch (err) {
    console.log(`FAIL ${preset.id}: ${String(err)}`);
    fail++;
  }
}
console.log(`\n${pass}/${PROCEDURAL_PRESETS.length} presets ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
