// Migration smoke test. Constructs synthetic legacy graphs with retired
// typeIds (combine-rgb, separate-rgb, bool-to-float) and confirms that
// migrateGraph rewrites them into the current shape with edges intact.

import { migrateGraph, type NodeGraph } from "@/shaders/node-graph";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK   ${name}`);
    pass++;
  } catch (err) {
    console.log(`FAIL ${name}: ${String(err)}`);
    fail++;
  }
}

check("rename combine-rgb → combine-color", () => {
  const g: NodeGraph = {
    nodes: [{ id: "n1", typeId: "combine-rgb", config: {}, position: { x: 0, y: 0 } }],
    edges: [],
  };
  migrateGraph(g);
  assert(g.nodes[0].typeId === "combine-color", "typeId should be combine-color");
});

check("rename separate-rgb → separate-color", () => {
  const g: NodeGraph = {
    nodes: [{ id: "n1", typeId: "separate-rgb", config: {}, position: { x: 0, y: 0 } }],
    edges: [],
  };
  migrateGraph(g);
  assert(g.nodes[0].typeId === "separate-color", "typeId should be separate-color");
});

check("bool-to-float → reroute with edge rename", () => {
  const g: NodeGraph = {
    nodes: [
      { id: "src", typeId: "value", config: { value: true }, position: { x: 0, y: 0 } },
      { id: "btf", typeId: "bool-to-float", config: {}, position: { x: 0, y: 0 } },
      { id: "dst", typeId: "math", config: { op: "mul" }, position: { x: 0, y: 0 } },
    ],
    edges: [
      { fromNodeId: "src", fromPin: "out", toNodeId: "btf", toPin: "x" },
      { fromNodeId: "btf", fromPin: "out", toNodeId: "dst", toPin: "a" },
    ],
  };
  migrateGraph(g);
  const btf = g.nodes.find((n) => n.id === "btf");
  assert(btf, "bool-to-float node should survive");
  assert(btf!.typeId === "reroute", `expected reroute, got ${btf!.typeId}`);
  assert(
    (btf!.config as { pinType?: string }).pinType === "bool",
    "reroute pinType should be bool",
  );
  const inboundEdge = g.edges.find((e) => e.toNodeId === "btf");
  assert(inboundEdge?.toPin === "in", `inbound pin should be renamed x→in, got ${inboundEdge?.toPin}`);
  const outboundEdge = g.edges.find((e) => e.fromNodeId === "btf");
  assert(outboundEdge?.fromPin === "out", "outbound pin should remain 'out'");
});

check("vector-math op rotate2D → rotate-2d", () => {
  const g: NodeGraph = {
    nodes: [{ id: "vm", typeId: "vector-math", config: { op: "rotate2D" }, position: { x: 0, y: 0 } }],
    edges: [],
  };
  migrateGraph(g);
  assert(
    (g.nodes[0].config as { op?: string }).op === "rotate-2d",
    `expected rotate-2d, got ${(g.nodes[0].config as { op?: string }).op}`,
  );
});

check("gradient-domain collapse: linear-gradient-domain → mode=linear", () => {
  const g: NodeGraph = {
    nodes: [
      {
        id: "g",
        typeId: "linear-gradient-domain",
        config: { start: [0, 0.5], end: [1, 0.5] },
        position: { x: 0, y: 0 },
      },
    ],
    edges: [],
  };
  migrateGraph(g);
  assert(g.nodes[0].typeId === "gradient-domain", "typeId should be gradient-domain");
  assert(
    (g.nodes[0].config as { mode?: string }).mode === "linear",
    "mode should be 'linear'",
  );
});

check("gradient-domain collapse: radial-gradient-domain → mode=radial", () => {
  const g: NodeGraph = {
    nodes: [{ id: "g", typeId: "radial-gradient-domain", config: {}, position: { x: 0, y: 0 } }],
    edges: [],
  };
  migrateGraph(g);
  assert(g.nodes[0].typeId === "gradient-domain", "typeId should be gradient-domain");
  assert(
    (g.nodes[0].config as { mode?: string }).mode === "radial",
    "mode should be 'radial'",
  );
});

check("lattice-mask collapse: checker-texture → mode=checker", () => {
  const g: NodeGraph = {
    nodes: [
      { id: "n", typeId: "checker-texture", config: { scale: 8 }, position: { x: 0, y: 0 } },
    ],
    edges: [],
  };
  migrateGraph(g);
  assert(g.nodes[0].typeId === "lattice-mask", "typeId should be lattice-mask");
  assert(
    (g.nodes[0].config as { mode?: string }).mode === "checker",
    "mode should be 'checker'",
  );
});

check("lattice-mask collapse: dot-grid → mode=dots", () => {
  const g: NodeGraph = {
    nodes: [{ id: "n", typeId: "dot-grid", config: {}, position: { x: 0, y: 0 } }],
    edges: [],
  };
  migrateGraph(g);
  assert(g.nodes[0].typeId === "lattice-mask", "typeId should be lattice-mask");
  assert(
    (g.nodes[0].config as { mode?: string }).mode === "dots",
    "mode should be 'dots'",
  );
});

check("idempotent on already-migrated graph", () => {
  const g: NodeGraph = {
    nodes: [{ id: "n1", typeId: "combine-color", config: {}, position: { x: 0, y: 0 } }],
    edges: [],
  };
  migrateGraph(g);
  migrateGraph(g);
  assert(g.nodes[0].typeId === "combine-color", "still combine-color after double-migration");
});

console.log(`\n${pass}/${pass + fail} migrations ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
