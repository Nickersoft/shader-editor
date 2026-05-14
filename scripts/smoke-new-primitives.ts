// Smoke test for primitives added in this pass — confirms each emits a
// non-empty GLSL block when wired through a minimal graph.

import "@/shaders/node-graph/primitives";
import { emitGraph } from "@/shaders/node-graph";
import type { NodeGraph } from "@/shaders/node-graph";

interface Case {
  name: string;
  typeId: string;
  config: Record<string, unknown>;
  outPin: string;
  groupPin: "color" | "alpha";
}

const cases: Case[] = [
  { name: "mapping point", typeId: "mapping", config: { mode: "point" }, outPin: "out", groupPin: "color" },
  { name: "mapping texture", typeId: "mapping", config: { mode: "texture" }, outPin: "out", groupPin: "color" },
  { name: "mapping vector", typeId: "mapping", config: { mode: "vector" }, outPin: "out", groupPin: "color" },
  { name: "mapping normal", typeId: "mapping", config: { mode: "normal" }, outPin: "out", groupPin: "color" },
  { name: "projection perspective", typeId: "projection", config: { mode: "perspective" }, outPin: "out", groupPin: "color" },
  { name: "projection orthographic", typeId: "projection", config: { mode: "orthographic" }, outPin: "out", groupPin: "color" },
  { name: "normal sphere", typeId: "normal", config: { mode: "sphere" }, outPin: "out", groupPin: "color" },
  { name: "normal plane", typeId: "normal", config: { mode: "plane" }, outPin: "out", groupPin: "color" },
  // Vector-math vec3 mode + new ops.
  { name: "vector-math vec3 cross", typeId: "vector-math", config: { op: "cross", dim: "vec3" }, outPin: "out", groupPin: "color" },
  { name: "vector-math vec3 reflect", typeId: "vector-math", config: { op: "reflect", dim: "vec3" }, outPin: "out", groupPin: "color" },
  { name: "vector-math vec3 refract", typeId: "vector-math", config: { op: "refract", dim: "vec3" }, outPin: "out", groupPin: "color" },
  { name: "vector-math vec3 project", typeId: "vector-math", config: { op: "project", dim: "vec3" }, outPin: "out", groupPin: "color" },
  { name: "vector-math vec3 length → float (coerce)", typeId: "vector-math", config: { op: "length", dim: "vec3" }, outPin: "out", groupPin: "alpha" },
];

function buildGraph(c: Case): NodeGraph {
  return {
    nodes: [
      { id: "n", typeId: c.typeId, config: c.config, position: { x: 0, y: 0 } },
      { id: "go", typeId: "group-output", config: {}, position: { x: 200, y: 0 } },
    ],
    edges: [{ fromNodeId: "n", fromPin: c.outPin, toNodeId: "go", toPin: c.groupPin }],
  };
}

let pass = 0;
let fail = 0;
for (const c of cases) {
  try {
    const g = buildGraph(c);
    const e = emitGraph(g, { containerPrefix: "x" });
    if (!e.main.includes("return vec4(")) throw new Error("no return in main");
    if (!e.main.includes("n_n_")) throw new Error("node locals missing from emit");
    console.log(`OK   ${c.name}: deps=[${e.dependencies.join(",")}]`);
    pass++;
  } catch (err) {
    console.log(`FAIL ${c.name}: ${String(err)}`);
    fail++;
  }
}
console.log(`\n${pass}/${cases.length} new-primitive cases ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
