// Quick verification: emit each registered procedural texture shader's graph
// and ensure the result is non-trivial (has nodes, edges, a return statement).
// Doesn't run the GLSL through a compiler — that'd require a WebGL context —
// but catches the common failure modes (missing edges, GroupOutput unwired,
// primitives referencing unknown typeIds).

import "@/shaders";

import { listShaderClasses } from "@/shaders/core/registry";
import { emitGraph, type NodeGraph } from "@/shaders/node-graph";

interface ProceduralShaderClass {
  typeId: string;
  meta: { category: string };
  graph?: () => NodeGraph;
}

const presets = listShaderClasses().filter((c) => {
  const cls = c as unknown as ProceduralShaderClass;
  return cls.meta.category === "textures" && typeof cls.graph === "function";
});

let pass = 0;
let fail = 0;
for (const cls of presets) {
  const proc = cls as unknown as ProceduralShaderClass;
  const id = proc.typeId;
  try {
    const graph = proc.graph!();
    if (graph.nodes.length === 0) throw new Error("empty nodes");
    const out = graph.nodes.find((n) => n.typeId === "group-output");
    if (!out) throw new Error("missing group-output");
    const e = emitGraph(graph, { containerPrefix: "x" });
    if (!e.main.includes("return vec4(")) throw new Error("no return in main");
    console.log(
      `OK  ${id}: ${graph.nodes.length} nodes, ${graph.edges.length} edges, deps=[${e.dependencies.join(",")}]`,
    );
    pass++;
  } catch (err) {
    console.log(`FAIL ${id}: ${String(err)}`);
    fail++;
  }
}
console.log(`\n${pass}/${presets.length} presets ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
