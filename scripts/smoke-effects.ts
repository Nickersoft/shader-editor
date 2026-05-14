// Effect-graph smoke test. Walks every effect that extends GraphEffectBase
// (currently the migrated adjustments + distortions), invokes its
// `static defaultGraph()`, and emits the GLSL to confirm the graph hydrates
// and the typeIds in it all resolve.
//
// Runs under Bun, bypassing the Svelte runes that would otherwise need a
// compiler pass.

import { emitGraph } from "@/shaders/node-graph";

// Side-effect imports — each one calls register() and surfaces a
// defaultGraph() factory we can call statically.
import "@/shaders/adjustments/brightness-contrast";
import "@/shaders/adjustments/grayscale";
import "@/shaders/adjustments/invert";
import "@/shaders/adjustments/hue-shift";
import "@/shaders/adjustments/saturation";
import "@/shaders/adjustments/posterize";
import "@/shaders/adjustments/solarize";
import "@/shaders/adjustments/tint";
import "@/shaders/adjustments/vibrance";
import "@/shaders/adjustments/duotone";
import "@/shaders/adjustments/tritone";

import "@/shaders/distortion/twirl";
import "@/shaders/distortion/mirror";
import "@/shaders/distortion/kaleidoscope";
import "@/shaders/distortion/flow-field";
import "@/shaders/distortion/rectangular-coordinates";
import "@/shaders/distortion/stretch";
import "@/shaders/distortion/bulge";
import "@/shaders/distortion/form3d";
import "@/shaders/distortion/glass-tiles";
import "@/shaders/distortion/fluted-glass";

import { listPrimitives } from "@/shaders/node-graph";

const EFFECT_IDS = [
  "brightness-contrast",
  "grayscale",
  "invert",
  "hue-shift",
  "saturation",
  "posterize",
  "solarize",
  "tint",
  "vibrance",
  "duotone",
  "tritone",
  "twirl",
  "mirror",
  "kaleidoscope",
  "flow-field",
  "rectangular-coordinates",
  "stretch",
  "bulge",
  "form3d",
  "glass-tiles",
  "fluted-glass",
];

// Pull the GraphEffectBase subclasses out of the core-node registry. Each
// has a `static defaultGraph()`.
import { getNodeClass } from "@/shaders/core/registry";

let pass = 0;
let fail = 0;
for (const id of EFFECT_IDS) {
  try {
    const cls = getNodeClass(id) as unknown as { defaultGraph?: () => unknown };
    if (!cls || typeof cls.defaultGraph !== "function") {
      throw new Error(`missing defaultGraph factory`);
    }
    const graph = cls.defaultGraph() as Parameters<typeof emitGraph>[0];
    if (!graph.nodes || graph.nodes.length === 0) throw new Error("empty graph");
    const out = graph.nodes.find((n) => n.typeId === "group-output");
    if (!out) throw new Error("missing group-output");
    const emitted = emitGraph(graph, { containerPrefix: "fx" });
    if (!emitted.main.includes("return vec4(")) throw new Error("no return in main");
    console.log(`OK   ${id}: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    pass++;
  } catch (err) {
    console.log(`FAIL ${id}: ${String(err)}`);
    fail++;
  }
}
console.log(`\n${pass}/${EFFECT_IDS.length} effects ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
