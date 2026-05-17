// Effect-graph smoke test. Walks every effect that extends GraphEffectBase
// (currently the migrated adjustments + distortions), invokes its
// `static graph()`, and emits the GLSL to confirm the graph hydrates
// and the typeIds in it all resolve.
//
// Runs under Bun, bypassing the Svelte runes that would otherwise need a
// compiler pass.

import { emitGraph } from "@/shaders/node-graph";

// Side-effect imports — each one calls register() and surfaces a
// graph() factory we can call statically.
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
import "@/shaders/adjustments/sharpness";

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
import "@/shaders/distortion/wave-distortion";
import "@/shaders/distortion/polar-coordinates";

import "@/shaders/stylize/vignette";
import "@/shaders/stylize/chromatic-aberration";
import "@/shaders/stylize/film-grain";
import "@/shaders/stylize/paper";
import "@/shaders/stylize/contour-lines";

import "@/shaders/shape-effects/emboss";
import "@/shaders/shape-effects/smoke-fill";

import "@/shaders/blurs/linear-blur";
import "@/shaders/blurs/angular-blur";
import "@/shaders/blurs/zoom-blur";
import "@/shaders/blurs/diffuse-blur";
import "@/shaders/blurs/blur";
import "@/shaders/blurs/channel-blur";
import "@/shaders/blurs/progressive-blur";
import "@/shaders/blurs/tilt-shift";
import "@/shaders/stylize/drop-shadow";
import "@/shaders/stylize/glow";
import "@/shaders/stylize/crt-screen";
import "@/shaders/stylize/dither";
import "@/shaders/stylize/halftone";
import "@/shaders/stylize/ascii";
import "@/shaders/stylize/glitch";
import "@/shaders/stylize/pixelate";
import "@/shaders/shape-effects/neon";
import "@/shaders/shape-effects/glass";
import "@/shaders/shape-effects/crystal";
import "@/shaders/distortion/concentric-spin";
import "@/shaders/distortion/spherize";
import "@/shaders/distortion/perspective";
import "@/shaders/interactive/shatter";
import "@/shaders/distortion/polar-flow-field";
import "@/shaders/stylize/vhs";
import "@/shaders/stylize/lens-flare";
import "@/shaders/interactive/cursor-trail";

import "@/shaders/interactive/cursor-ripples";
import "@/shaders/interactive/fog";
import "@/shaders/interactive/liquify";
import "@/shaders/interactive/grid-distortion";

const EFFECT_IDS = [
  // adjustments
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
  "sharpness",
  // distortions
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
  "wave-distortion",
  "polar-coordinates",
  // stylize
  "vignette",
  "chromatic-aberration",
  "film-grain",
  "paper",
  "contour-lines",
  // shape-effects
  "emboss",
  "smoke-fill",
  // blurs
  "linear-blur",
  "angular-blur",
  "zoom-blur",
  "diffuse-blur",
  "blur",
  "channel-blur",
  "progressive-blur",
  "tilt-shift",
  // stylize composites
  "drop-shadow",
  "glow",
  "crt-screen",
  "dither",
  "halftone",
  "ascii",
  "glitch",
  "pixelate",
  // shape-effects continued
  "neon",
  "glass",
  "crystal",
  // distortion remainder
  "concentric-spin",
  "spherize",
  "perspective",
  // interactive remainder
  "shatter",
  // large composites
  "polar-flow-field",
  "vhs",
  "lens-flare",
  "cursor-trail",
  // interactive
  "cursor-ripples",
  "fog",
  "liquify",
  "grid-distortion",
];

// Pull the GraphEffectBase subclasses out of the core-node registry. Each
// has a `static graph()`.
import { getShaderClass } from "@/shaders/core/registry";

let pass = 0;
let fail = 0;
for (const id of EFFECT_IDS) {
  try {
    const cls = getShaderClass(id) as unknown as { graph?: () => unknown };
    if (!cls || typeof cls.graph !== "function") {
      throw new Error(`missing graph factory`);
    }
    const graph = cls.graph() as Parameters<typeof emitGraph>[0];
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
