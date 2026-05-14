// Math-node smoke test. Constructs a minimal graph per op and emits the
// GLSL, verifying that every op (unary / binary / ternary) is wired through
// the primitive correctly.

import "@/shaders/node-graph/primitives";
import { emitGraph, getPrimitive } from "@/shaders/node-graph";
import type { NodeGraph } from "@/shaders/node-graph";

const prim = getPrimitive("math");
if (!prim) {
  console.error("math primitive not registered");
  process.exit(1);
}

const UNARY = [
  "sin", "cos", "tan", "arcsine", "arccosine", "arctangent",
  "abs", "neg", "oneminus", "sign", "sqrt", "inverse-sqrt",
  "exp", "log",
  "floor", "ceil", "round", "trunc", "fract",
  "to-radians", "to-degrees",
];
const BINARY = [
  "add", "sub", "mul", "div", "min", "max", "pow", "mod", "step", "atan2",
  "less-than", "greater-than",
];
const TERNARY = ["mix", "smoothstep", "compare", "smooth-min", "smooth-max"];

function buildGraph(op: string): NodeGraph {
  return {
    nodes: [
      { id: "m", typeId: "math", config: { op }, position: { x: 0, y: 0 } },
      { id: "go", typeId: "group-output", config: {}, position: { x: 100, y: 0 } },
    ],
    edges: [
      // Wire the math output to the group-output's color pin. Coercion
      // promotes the float result to vec3 so emitGraph closes cleanly.
      { fromNodeId: "m", fromPin: "out", toNodeId: "go", toPin: "color" },
    ],
  };
}

let pass = 0;
let fail = 0;
for (const op of [...UNARY, ...BINARY, ...TERNARY]) {
  try {
    const g = buildGraph(op);
    const e = emitGraph(g, { containerPrefix: "x" });
    if (!e.main.includes("return vec4(")) throw new Error("no return in main");
    // Sanity: input shape morphs with the op.
    const pins = prim.inputs({ op }) as { id: string }[];
    const expected = UNARY.includes(op) ? 1 : TERNARY.includes(op) ? 3 : 2;
    if (pins.length !== expected) throw new Error(`expected ${expected} input pins, got ${pins.length}`);
    console.log(`OK   ${op}: ${pins.length} input(s)`);
    pass++;
  } catch (err) {
    console.log(`FAIL ${op}: ${String(err)}`);
    fail++;
  }
}
console.log(`\n${pass}/${UNARY.length + BINARY.length + TERNARY.length} math ops ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
