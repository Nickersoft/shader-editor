// Topological-sort GLSL emitter.
//
// Walks the graph backwards from GroupOutput, collects reachable nodes,
// topo-sorts them, and emits per-node GLSL statements. Output pins become
// uniquely-named locals; downstream consumers reference those locals.
// Unwired inputs fall back to their pin's default value as a GLSL literal.

import { sanitizeName } from "@/shaders/core/node.svelte";
import type { GlslHelperName } from "@/shaders/core/types";
import type { ExtraUniformDecl } from "@/lib/codegen/types";
import { requirePrimitive, type UniformSpec } from "./registry";
import { glslLiteral, glslTypeOf, type Edge, type GraphNode, type NodeGraph, type PinSpec } from "./types";

export const GROUP_INPUT_TYPE_ID = "group-input";
export const GROUP_OUTPUT_TYPE_ID = "group-output";

export interface EmittedGraph {
  /** The fragment-function body — statements ending with `return vec4(...);`. */
  main: string;
  /** GLSL helper names this graph needs. */
  dependencies: GlslHelperName[];
  /** Uniforms declared by the graph's nodes (forwarded to the container's extraUniforms). */
  uniforms: ExtraUniformDecl[];
}

export interface EmitOptions {
  /** Container-level prefix (e.g. the layer's slug) — all uniform names live under this. */
  containerPrefix: string;
}

interface ResolvedNode {
  node: GraphNode;
  inputs: PinSpec[];
  outputs: PinSpec[];
  outputLocals: Record<string, string>;
  uniformNames: Record<string, string>;
  uniformSpecs: readonly UniformSpec[];
}

/**
 * Produce the fragment-body GLSL for a NodeGraph.
 *
 * Contract:
 *   - Exactly one GroupOutput node must be present; its single `color` input
 *     drives the final `return vec4(<color>, 1.0);`. If absent, a black frame
 *     is returned — the graph is incomplete but does not error.
 *   - Cycles are rejected with a clear error (graphs are DAGs).
 *   - Nodes unreachable from GroupOutput are silently dropped.
 */
export function emitGraph(graph: NodeGraph, opts: EmitOptions): EmittedGraph {
  const groupOutput = graph.nodes.find((n) => n.typeId === GROUP_OUTPUT_TYPE_ID);
  if (!groupOutput) {
    return { main: "return vec4(0.0, 0.0, 0.0, 1.0);", dependencies: [], uniforms: [] };
  }

  const order = topoSort(graph, groupOutput.id);

  // Index helpers
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n] as const));
  const edgesByTarget = new Map<string, Edge[]>();
  for (const e of graph.edges) {
    const list = edgesByTarget.get(e.toNodeId);
    if (list) list.push(e);
    else edgesByTarget.set(e.toNodeId, [e]);
  }

  // Resolve each ordered node into its pin shape and unique local names.
  const resolved = new Map<string, ResolvedNode>();
  const uniforms: ExtraUniformDecl[] = [];

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    const prim = requirePrimitive(node.typeId);
    const inputs = prim.inputs(node.config) as PinSpec[];
    const outputs = prim.outputs(node.config) as PinSpec[];
    const slug = sanitizeName(node.id);
    const outputLocals: Record<string, string> = {};
    for (const pin of outputs) {
      outputLocals[pin.id] = `n_${slug}_${pin.id}`;
    }
    const uniformSpecs = prim.uniforms?.(node) ?? [];
    const uniformNames: Record<string, string> = {};
    for (const u of uniformSpecs) {
      const name = `u_${opts.containerPrefix}_${slug}_${u.nameSuffix}`;
      uniformNames[u.nameSuffix] = name;
      uniforms.push({
        nameSuffix: `${slug}_${u.nameSuffix}`,
        type: u.type,
        value: u.value,
        originalPath: ["graph", "nodes", node.id, u.nameSuffix],
        originalName: `${prim.name} · ${u.nameSuffix}`,
      });
    }
    resolved.set(nodeId, { node, inputs, outputs, outputLocals, uniformNames, uniformSpecs });
  }

  // Emit statements in topo order.
  const lines: string[] = [];
  const deps = new Set<GlslHelperName>();

  for (const nodeId of order) {
    const r = resolved.get(nodeId);
    if (!r) continue;
    const prim = requirePrimitive(r.node.typeId);
    const incoming = edgesByTarget.get(nodeId) ?? [];
    const inputExprs: Record<string, string> = {};
    for (const pin of r.inputs) {
      const edge = incoming.find((e) => e.toPin === pin.id);
      if (edge) {
        const upstream = resolved.get(edge.fromNodeId);
        const local = upstream?.outputLocals[edge.fromPin];
        if (local) {
          inputExprs[pin.id] = local;
          continue;
        }
      }
      inputExprs[pin.id] = glslLiteral(pin.type, pin.default);
    }

    const result = prim.emit({
      inputs: inputExprs,
      outputs: r.outputLocals,
      uniforms: r.uniformNames,
      config: r.node.config,
      addDependency: (name) => deps.add(name),
    });

    lines.push(`// ${r.node.typeId} (${r.node.id})`);
    lines.push(result.statements.trim());
  }

  // GroupOutput's input expression becomes the final return.
  const finalNode = resolved.get(groupOutput.id);
  const colorExpr = finalNode
    ? extractFinalColor(finalNode, edgesByTarget.get(groupOutput.id) ?? [], resolved)
    : "vec3(0.0)";

  return {
    main: `${lines.join("\n")}\nreturn vec4(${colorExpr}, 1.0);`,
    dependencies: Array.from(deps),
    uniforms,
  };
}

/**
 * The GroupOutput primitive emits a local `_final_color` from its input pin.
 * We could read that local here, but reading the upstream local directly skips
 * one assignment and keeps the emitted GLSL one line shorter.
 */
function extractFinalColor(
  groupOutput: ResolvedNode,
  incoming: Edge[],
  resolved: Map<string, ResolvedNode>,
): string {
  const edge = incoming.find((e) => e.toPin === "color");
  if (!edge) {
    const colorPin = groupOutput.inputs.find((p) => p.id === "color");
    return colorPin ? glslLiteral(colorPin.type, colorPin.default) : "vec3(0.0)";
  }
  const upstream = resolved.get(edge.fromNodeId);
  return upstream?.outputLocals[edge.fromPin] ?? "vec3(0.0)";
}

/**
 * Iterative topological sort of nodes reachable from `rootId`, walking edges
 * in the upstream direction (fromNodeId is a dependency of toNodeId).
 *
 * Returns nodes in dependency order: a node appears after all nodes its inputs
 * depend on. Throws on cycle.
 */
function topoSort(graph: NodeGraph, rootId: string): string[] {
  const incomingByTarget = new Map<string, Edge[]>();
  for (const e of graph.edges) {
    const list = incomingByTarget.get(e.toNodeId);
    if (list) list.push(e);
    else incomingByTarget.set(e.toNodeId, [e]);
  }

  // Gather reachable set.
  const reachable = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const incoming = incomingByTarget.get(id);
    if (!incoming) continue;
    for (const e of incoming) {
      if (!reachable.has(e.fromNodeId)) stack.push(e.fromNodeId);
    }
  }

  // DFS postorder yields a topo sort; cycles trip the WIP guard.
  const order: string[] = [];
  const VISITING = 1;
  const VISITED = 2;
  const state = new Map<string, number>();

  function visit(id: string): void {
    const s = state.get(id);
    if (s === VISITED) return;
    if (s === VISITING) throw new Error(`Cycle detected in node graph at ${id}`);
    state.set(id, VISITING);
    const incoming = incomingByTarget.get(id);
    if (incoming) for (const e of incoming) if (reachable.has(e.fromNodeId)) visit(e.fromNodeId);
    state.set(id, VISITED);
    order.push(id);
  }

  for (const id of reachable) visit(id);
  return order;
}
