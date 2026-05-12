import { z } from "zod";
import {
  GeneratorNode,
  type NodeInit,
  type SerializedNode,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import type { ExtraUniformDecl } from "@/lib/codegen/types";
import {
  emitGraph,
  GROUP_INPUT_TYPE_ID,
  GROUP_OUTPUT_TYPE_ID,
  requirePrimitive,
  type Edge as GraphEdge,
  type GraphNode,
  type NodeGraph,
} from "@/shaders/node-graph";

const config = z.object({
  presetId: z.string().nullable().default(null),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Procedural Field",
  description: "Composable DAG of primitives — attributes, math, sources, ramps",
  color: "#a855f7",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class ProceduralField extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "procedural-field";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  /**
   * The DAG of primitives that produces this layer's color. Always contains
   * exactly one `group-input` and exactly one `group-output` node; everything
   * else is user-authored.
   */
  graph = $state<NodeGraph>(defaultGraph());

  constructor(init: NodeInit = {}) {
    super(init);
    // Pull `graph` out of init.config before super's Zod parse strips it.
    // The Zod schema intentionally doesn't validate graph shape — that's the
    // graph subsystem's job; here we just round-trip the JSON.
    const raw = (init.config as { graph?: NodeGraph } | undefined)?.graph;
    if (raw && Array.isArray(raw.nodes) && Array.isArray(raw.edges)) {
      this.graph = { nodes: raw.nodes.map(cloneNode), edges: raw.edges.map((e) => ({ ...e })) };
    }
  }

  /**
   * Structural fingerprint — folded into the scene's rebuild key. Excludes
   * each primitive's live-value paths so uniform edits stay live (no recompile).
   */
  structuralKey(): string {
    const parts: string[] = [];
    for (const node of this.graph.nodes) {
      const prim = safeRequire(node.typeId);
      const livePaths = prim
        ? (prim.uniforms?.(node) ?? []).map((u) => u.valuePath ?? [u.nameSuffix])
        : [];
      const structural = excludePaths(node.config, livePaths);
      parts.push(`${node.id}:${node.typeId}:${JSON.stringify(structural)}`);
    }
    parts.sort();
    const edgePart = this.graph.edges
      .map((e) => `${e.fromNodeId}.${e.fromPin}->${e.toNodeId}.${e.toPin}`)
      .sort()
      .join(",");
    return `${parts.join("|")}#${edgePart}`;
  }

  extraUniforms(): ExtraUniformDecl[] {
    return emitGraph(this.graph, { containerPrefix: this.prefix }).uniforms;
  }

  glsl(): GlslBlock {
    const emitted = emitGraph(this.graph, { containerPrefix: this.prefix });
    return {
      dependencies: emitted.dependencies,
      main: emitted.main,
    };
  }

  toJSON(): SerializedNode {
    const base = super.toJSON();
    return {
      ...base,
      config: {
        ...(base.config as Record<string, unknown>),
        graph: {
          nodes: this.graph.nodes.map(cloneNode),
          edges: this.graph.edges.map((e) => ({ ...e })),
        },
      },
    };
  }
}

register(ProceduralField);
export default ProceduralField;

// ============================================================================
// Helpers

function cloneNode(n: GraphNode): GraphNode {
  return {
    id: n.id,
    typeId: n.typeId,
    config: structuredClone(n.config),
    position: { ...n.position },
  };
}

function safeRequire(typeId: string): ReturnType<typeof requirePrimitive> | null {
  try {
    return requirePrimitive(typeId);
  } catch {
    return null;
  }
}

/**
 * Returns a deep-cloned copy of `value` with every path in `paths` excluded
 * (dropped from objects, replaced with `null` in arrays). Used by structuralKey
 * to omit live-uniform-value fields from the rebuild fingerprint.
 */
function excludePaths(value: unknown, paths: readonly (readonly string[])[]): unknown {
  if (paths.length === 0) return value;
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      const sub = pathsForKey(paths, String(i));
      return excludePaths(item, sub);
    });
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const sub = pathsForKey(paths, key);
      // Empty subpath means this key is the exclusion target.
      if (sub.some((p) => p.length === 0)) continue;
      out[key] = excludePaths((value as Record<string, unknown>)[key], sub);
    }
    return out;
  }
  return value;
}

function pathsForKey(
  paths: readonly (readonly string[])[],
  key: string,
): readonly (readonly string[])[] {
  const out: (readonly string[])[] = [];
  for (const p of paths) {
    if (p[0] === key) out.push(p.slice(1));
  }
  return out;
}

// ============================================================================
// Default graph: pulsing screen wired through a GroupInput `speed` pin.

function defaultGraph(): NodeGraph {
  const gi: GraphNode = {
    id: "gi",
    typeId: GROUP_INPUT_TYPE_ID,
    config: {
      pins: [{ id: "speed", type: "float", label: "Speed", default: 1 }],
    },
    position: { x: -240, y: 0 },
  };
  const time: GraphNode = {
    id: "time",
    typeId: "time",
    config: {},
    position: { x: 0, y: -80 },
  };
  const mul: GraphNode = {
    id: "mul",
    typeId: "combine",
    config: { op: "mul" },
    position: { x: 220, y: 0 },
  };
  const sn: GraphNode = {
    id: "sn",
    typeId: "math",
    config: { op: "sin" },
    position: { x: 440, y: 0 },
  };
  const ramp: GraphNode = {
    id: "ramp",
    typeId: "color-ramp",
    config: {
      stops: [
        { position: 0, color: [0.08, 0.06, 0.18] },
        { position: 1, color: [0.95, 0.42, 0.78] },
      ],
    },
    position: { x: 660, y: 0 },
  };
  const go: GraphNode = {
    id: "go",
    typeId: GROUP_OUTPUT_TYPE_ID,
    config: {},
    position: { x: 900, y: 0 },
  };

  const edges: GraphEdge[] = [
    { fromNodeId: "time", fromPin: "out", toNodeId: "mul", toPin: "a" },
    { fromNodeId: "gi", fromPin: "speed", toNodeId: "mul", toPin: "b" },
    { fromNodeId: "mul", fromPin: "out", toNodeId: "sn", toPin: "x" },
    { fromNodeId: "sn", fromPin: "out", toNodeId: "ramp", toPin: "t" },
    { fromNodeId: "ramp", fromPin: "out", toNodeId: "go", toPin: "color" },
  ];

  return { nodes: [gi, time, mul, sn, ramp, go], edges };
}
