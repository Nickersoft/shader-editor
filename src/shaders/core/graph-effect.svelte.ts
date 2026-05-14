// GraphEffectBase — shared base for effects whose body is a node graph rather
// than hand-written GLSL. Mirrors `ProceduralField` on the EffectNode side:
// owns a `graph: NodeGraph`, defers `glsl()` and `extraUniforms()` to
// `emitGraph`, and serialises the graph alongside the rest of the node so live
// parameter values (encoded as GroupInput pin defaults) round-trip.
//
// Subclasses register their own typeId, supply `meta`, and provide a
// `defaultGraph()` factory that builds the effect's DAG using
// `EffectGraphBuilder`. The graph's single GroupInput declares the layer's
// user-facing parameters; the property panel reads & writes those pin defaults.

import { z } from "zod";
import {
  EffectNode,
  type NodeInit,
  type SerializedNode,
} from "@/shaders/core/node.svelte";
import type { GlslBlock } from "@/shaders/core/types";
import type { ExtraUniformDecl } from "@/lib/codegen/types";
import {
  emitGraph,
  migrateGraph,
  requirePrimitive,
  type Edge as GraphEdge,
  type GraphNode,
  type NodeGraph,
} from "@/shaders/node-graph";

const config = z.object({});
const uniforms = z.object({});

type Config = z.infer<typeof config>;
type Uniforms = z.infer<typeof uniforms>;

export interface GraphEffectClass {
  defaultGraph(): NodeGraph;
}

export abstract class GraphEffectBase extends EffectNode<Config, Uniforms> {
  static readonly config = config;
  static readonly uniforms = uniforms;

  graph = $state<NodeGraph>({ nodes: [], edges: [] });

  constructor(init: NodeInit = {}) {
    super(init);
    // Hydrate from serialized form if present, otherwise call the subclass's
    // factory. Pulling `graph` out of `init.config` happens here (not in the
    // Zod parse) because the schema intentionally doesn't validate graph
    // shape — that's the graph subsystem's job.
    const raw = (init.config as { graph?: NodeGraph } | undefined)?.graph;
    if (raw && Array.isArray(raw.nodes) && Array.isArray(raw.edges)) {
      // Migrate after cloning so the in-state graph carries only current
      // typeIds — saved scenes survive renames and structural retirements.
      this.graph = migrateGraph(cloneGraph(raw));
    } else {
      const factory = (this.constructor as unknown as GraphEffectClass).defaultGraph;
      if (typeof factory !== "function") {
        throw new Error(
          `${this.constructor.name}: subclass of GraphEffectBase must declare static defaultGraph()`,
        );
      }
      this.graph = factory();
    }
  }

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
      .map((e: GraphEdge) => `${e.fromNodeId}.${e.fromPin}->${e.toNodeId}.${e.toPin}`)
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
        graph: cloneGraph(this.graph),
      },
    };
  }
}

function cloneGraph(g: NodeGraph): NodeGraph {
  return {
    nodes: g.nodes.map(cloneNode),
    edges: g.edges.map((e) => ({ ...e })),
    ...(g.frames
      ? {
          frames: g.frames.map((f) => ({
            ...f,
            position: { ...f.position },
            size: { ...f.size },
            ...(f.nodeIds ? { nodeIds: [...f.nodeIds] } : {}),
          })),
        }
      : {}),
  };
}

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
