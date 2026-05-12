// Canonical hand-authored graphs used as Phase 2 verification fixtures.
//
// Each function returns a fresh `NodeGraph` — primitive-only, no surprising
// dependencies — so we can swap them into ProceduralField's default and
// inspect the rendered result against the legacy field-stage equivalent.

import { GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID } from "./emit";
import type { Edge, GraphNode, NodeGraph } from "./types";

/**
 * God Rays — Phase 2 gate.
 *
 * Decomposes the monolithic `god-rays` field stage into primitives:
 *
 *   Position → PolarTransform → SeparateXY → (r, a01)
 *   a01 × 2π × (density·30 + 1)         = noise.x  (`ang_freq`)
 *   r × 2  −  t × 0.6                    = noise1.y
 *   r × 1.2 − t × 0.4                    = noise2.y, noise2.x scaled ×2.5
 *   Noise(value, noise1_uv) · Noise(value, noise2_uv)  → np
 *   np ^ (4 − 3·weight) · exp(−r·decay) → n
 *   ColorRamp(clamp(n)) → output
 *
 * The graph is 28 nodes and visibly faithful to `src/shaders/field-stages/
 * god-rays.ts` — the only departure is the angle's wrap point (the legacy
 * code uses `atan2` in `[-π, π]`, the graph uses `angle01 × 2π` in `[0, 2π]`),
 * which is invisible at runtime because `valueNoise` is periodic over its
 * input space.
 */
export function godRaysGraph(): NodeGraph {
  // Layout pass first — every node's position is hand-tuned for canvas
  // legibility (left-to-right dataflow, vertical lanes per intermediate).
  const X0 = -400; // GroupInput column
  const X1 = -200; // Position / Time
  const X2 = 0; // Polar / Const
  const X3 = 200; // separateXY / constants for math
  const X4 = 400; // first-tier math
  const X5 = 600; // second-tier math
  const X6 = 800; // noise inputs
  const X7 = 1000; // noises
  const X8 = 1200; // np / weight / decay
  const X9 = 1400; // power / decay_factor
  const X10 = 1600; // n_final → ramp
  const X11 = 1800; // group output

  const nodes: GraphNode[] = [
    // —— inputs ——
    {
      id: "gi",
      typeId: GROUP_INPUT_TYPE_ID,
      config: {
        pins: [
          { id: "center", type: "vec2", label: "Center", default: [0, 0] },
          { id: "density", type: "float", label: "Density", default: 0.3 },
          { id: "decay", type: "float", label: "Decay", default: 0.6 },
          { id: "weight", type: "float", label: "Weight", default: 0.8 },
        ],
      },
      position: { x: X0, y: 0 },
    },
    { id: "pos", typeId: "position", config: {}, position: { x: X1, y: -100 } },
    { id: "time", typeId: "time", config: {}, position: { x: X1, y: 220 } },

    // —— polar ——
    { id: "polar", typeId: "polar-transform", config: {}, position: { x: X2, y: -60 } },
    { id: "sep", typeId: "separate-xy", config: {}, position: { x: X3, y: -60 } },

    // —— constants ——
    { id: "k_tau", typeId: "const", config: { value: 6.2831853 }, position: { x: X2, y: 100 } },
    { id: "k_30", typeId: "const", config: { value: 30 }, position: { x: X2, y: 180 } },
    { id: "k_1", typeId: "const", config: { value: 1 }, position: { x: X2, y: 260 } },
    { id: "k_2", typeId: "const", config: { value: 2 }, position: { x: X3, y: 340 } },
    { id: "k_06", typeId: "const", config: { value: 0.6 }, position: { x: X4, y: 360 } },
    { id: "k_12", typeId: "const", config: { value: 1.2 }, position: { x: X3, y: 460 } },
    { id: "k_04", typeId: "const", config: { value: 0.4 }, position: { x: X4, y: 480 } },
    { id: "k_25", typeId: "const", config: { value: 2.5 }, position: { x: X5, y: 80 } },

    // —— frequency: (density × 30) + 1 ——
    { id: "dens30", typeId: "combine", config: { op: "mul" }, position: { x: X3, y: 180 } },
    { id: "freq", typeId: "combine", config: { op: "add" }, position: { x: X4, y: 180 } },
    // angle in radians: a01 × 2π
    { id: "ang_rad", typeId: "combine", config: { op: "mul" }, position: { x: X4, y: 40 } },
    // ang_rad × freq
    { id: "argx1", typeId: "combine", config: { op: "mul" }, position: { x: X5, y: 0 } },

    // —— noise1 y axis: r×2 − t×0.6 ——
    { id: "r2", typeId: "combine", config: { op: "mul" }, position: { x: X5, y: 280 } },
    { id: "t06", typeId: "combine", config: { op: "mul" }, position: { x: X5, y: 360 } },
    { id: "n1y", typeId: "combine", config: { op: "sub" }, position: { x: X6, y: 320 } },

    // —— noise1 ——
    { id: "n1uv", typeId: "combine-xy", config: {}, position: { x: X6, y: 100 } },
    { id: "n1", typeId: "noise", config: { kind: "value", scale: 1, seed: 0 }, position: { x: X7, y: 100 } },

    // —— noise2 ——
    { id: "argx2", typeId: "combine", config: { op: "mul" }, position: { x: X6, y: 0 } },
    { id: "r12", typeId: "combine", config: { op: "mul" }, position: { x: X5, y: 460 } },
    { id: "t04", typeId: "combine", config: { op: "mul" }, position: { x: X5, y: 540 } },
    { id: "n2y", typeId: "combine", config: { op: "sub" }, position: { x: X6, y: 500 } },
    { id: "n2uv", typeId: "combine-xy", config: {}, position: { x: X7, y: 280 } },
    { id: "n2", typeId: "noise", config: { kind: "value", scale: 1, seed: 0 }, position: { x: X8, y: 280 } },

    // —— np = n1 × n2 ——
    { id: "np", typeId: "combine", config: { op: "mul" }, position: { x: X8, y: 180 } },

    // —— weight_exp = MapRange(weight, 0..1 → 4..1, clamp) ——
    {
      id: "wexp",
      typeId: "map-range",
      config: { fromMin: 0, fromMax: 1, toMin: 4, toMax: 1, interp: "linear", clamp: true },
      position: { x: X8, y: 360 },
    },

    // —— power = pow(clamp(np,0..1), weight_exp) ——
    {
      id: "np_clamp",
      typeId: "map-range",
      config: { fromMin: 0, fromMax: 1, toMin: 0, toMax: 1, interp: "linear", clamp: true },
      position: { x: X9, y: 180 },
    },
    { id: "pow1", typeId: "combine", config: { op: "pow" }, position: { x: X10, y: 180 } },

    // —— decay_factor = exp(-r × decay) ——
    { id: "rd", typeId: "combine", config: { op: "mul" }, position: { x: X8, y: 560 } },
    { id: "negrd", typeId: "math", config: { op: "neg" }, position: { x: X9, y: 560 } },
    { id: "decf", typeId: "math", config: { op: "exp" }, position: { x: X10, y: 560 } },

    // —— n_final = clamp(power × decay_factor) → ColorRamp ——
    { id: "nfinal", typeId: "combine", config: { op: "mul" }, position: { x: X10, y: 360 } },
    {
      id: "nclamp",
      typeId: "map-range",
      config: { fromMin: 0, fromMax: 1, toMin: 0, toMax: 1, interp: "linear", clamp: true },
      position: { x: X10 + 100, y: 360 },
    },
    {
      id: "ramp",
      typeId: "color-ramp",
      config: {
        stops: [
          { position: 0, color: [1, 0.95, 0.7] },
          { position: 1, color: [0, 0, 0] },
        ],
      },
      position: { x: X11 - 100, y: 360 },
    },
    { id: "go", typeId: GROUP_OUTPUT_TYPE_ID, config: {}, position: { x: X11, y: 360 } },
  ];

  const edges: Edge[] = [
    // Polar transform
    { fromNodeId: "pos", fromPin: "out", toNodeId: "polar", toPin: "p" },
    { fromNodeId: "gi", fromPin: "center", toNodeId: "polar", toPin: "center" },
    { fromNodeId: "polar", fromPin: "out", toNodeId: "sep", toPin: "v" },
    // freq = density × 30 + 1
    { fromNodeId: "gi", fromPin: "density", toNodeId: "dens30", toPin: "a" },
    { fromNodeId: "k_30", fromPin: "out", toNodeId: "dens30", toPin: "b" },
    { fromNodeId: "dens30", fromPin: "out", toNodeId: "freq", toPin: "a" },
    { fromNodeId: "k_1", fromPin: "out", toNodeId: "freq", toPin: "b" },
    // ang_rad = a01 × 2π
    { fromNodeId: "sep", fromPin: "y", toNodeId: "ang_rad", toPin: "a" },
    { fromNodeId: "k_tau", fromPin: "out", toNodeId: "ang_rad", toPin: "b" },
    // argx1 = ang_rad × freq
    { fromNodeId: "ang_rad", fromPin: "out", toNodeId: "argx1", toPin: "a" },
    { fromNodeId: "freq", fromPin: "out", toNodeId: "argx1", toPin: "b" },
    // n1.y = r × 2 − t × 0.6
    { fromNodeId: "sep", fromPin: "x", toNodeId: "r2", toPin: "a" },
    { fromNodeId: "k_2", fromPin: "out", toNodeId: "r2", toPin: "b" },
    { fromNodeId: "time", fromPin: "out", toNodeId: "t06", toPin: "a" },
    { fromNodeId: "k_06", fromPin: "out", toNodeId: "t06", toPin: "b" },
    { fromNodeId: "r2", fromPin: "out", toNodeId: "n1y", toPin: "a" },
    { fromNodeId: "t06", fromPin: "out", toNodeId: "n1y", toPin: "b" },
    // n1 = valueNoise(argx1, n1y)
    { fromNodeId: "argx1", fromPin: "out", toNodeId: "n1uv", toPin: "x" },
    { fromNodeId: "n1y", fromPin: "out", toNodeId: "n1uv", toPin: "y" },
    { fromNodeId: "n1uv", fromPin: "out", toNodeId: "n1", toPin: "p" },
    // argx2 = argx1 × 2.5
    { fromNodeId: "argx1", fromPin: "out", toNodeId: "argx2", toPin: "a" },
    { fromNodeId: "k_25", fromPin: "out", toNodeId: "argx2", toPin: "b" },
    // n2.y = r × 1.2 − t × 0.4
    { fromNodeId: "sep", fromPin: "x", toNodeId: "r12", toPin: "a" },
    { fromNodeId: "k_12", fromPin: "out", toNodeId: "r12", toPin: "b" },
    { fromNodeId: "time", fromPin: "out", toNodeId: "t04", toPin: "a" },
    { fromNodeId: "k_04", fromPin: "out", toNodeId: "t04", toPin: "b" },
    { fromNodeId: "r12", fromPin: "out", toNodeId: "n2y", toPin: "a" },
    { fromNodeId: "t04", fromPin: "out", toNodeId: "n2y", toPin: "b" },
    // n2 = valueNoise(argx2, n2y)
    { fromNodeId: "argx2", fromPin: "out", toNodeId: "n2uv", toPin: "x" },
    { fromNodeId: "n2y", fromPin: "out", toNodeId: "n2uv", toPin: "y" },
    { fromNodeId: "n2uv", fromPin: "out", toNodeId: "n2", toPin: "p" },
    // np = n1 × n2
    { fromNodeId: "n1", fromPin: "out", toNodeId: "np", toPin: "a" },
    { fromNodeId: "n2", fromPin: "out", toNodeId: "np", toPin: "b" },
    // wexp = MapRange(weight)
    { fromNodeId: "gi", fromPin: "weight", toNodeId: "wexp", toPin: "x" },
    // power = pow(clamp(np), wexp)
    { fromNodeId: "np", fromPin: "out", toNodeId: "np_clamp", toPin: "x" },
    { fromNodeId: "np_clamp", fromPin: "out", toNodeId: "pow1", toPin: "a" },
    { fromNodeId: "wexp", fromPin: "out", toNodeId: "pow1", toPin: "b" },
    // decay_factor = exp(-r × decay)
    { fromNodeId: "sep", fromPin: "x", toNodeId: "rd", toPin: "a" },
    { fromNodeId: "gi", fromPin: "decay", toNodeId: "rd", toPin: "b" },
    { fromNodeId: "rd", fromPin: "out", toNodeId: "negrd", toPin: "x" },
    { fromNodeId: "negrd", fromPin: "out", toNodeId: "decf", toPin: "x" },
    // n_final = power × decay_factor → clamp → ramp
    { fromNodeId: "pow1", fromPin: "out", toNodeId: "nfinal", toPin: "a" },
    { fromNodeId: "decf", fromPin: "out", toNodeId: "nfinal", toPin: "b" },
    { fromNodeId: "nfinal", fromPin: "out", toNodeId: "nclamp", toPin: "x" },
    { fromNodeId: "nclamp", fromPin: "out", toNodeId: "ramp", toPin: "t" },
    { fromNodeId: "ramp", fromPin: "out", toNodeId: "go", toPin: "color" },
  ];

  return { nodes, edges };
}
