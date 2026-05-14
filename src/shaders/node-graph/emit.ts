// Topological-sort GLSL emitter.
//
// Walks the graph backwards from GroupOutput, collects reachable nodes,
// topo-sorts them, and emits per-node GLSL statements. Output pins become
// uniquely-named locals; downstream consumers reference those locals.
// Unwired inputs fall back to their pin's default value as a GLSL literal.
//
// Group nodes recurse: their subGraph is emitted inline with a slug prefix
// (so two instances of the same nested node don't collide on locals or
// uniform names) and a path prefix (so nested uniforms' `originalPath` points
// at `config.subGraph.nodes[i].config.*` in the live graph).

import { sanitizeName } from "@/shaders/core/node.svelte";
import type { GlslHelperName } from "@/shaders/core/types";
import type { ExtraUniformDecl } from "@/lib/codegen/types";
import { coerce } from "./coerce";
import { requirePrimitive, type UniformSpec } from "./registry";
import { glslLiteral, glslTypeOf, type Edge, type GraphNode, type NodeGraph, type PinSpec } from "./types";

export const GROUP_INPUT_TYPE_ID = "group-input";
export const GROUP_OUTPUT_TYPE_ID = "group-output";
export const GROUP_TYPE_ID = "group";

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
  inputs: readonly PinSpec[];
  outputs: readonly PinSpec[];
  outputLocals: Record<string, string>;
  uniformNames: Record<string, string>;
  uniformSpecs: readonly UniformSpec[];
}

interface EmitGraphIntoOpts {
  containerPrefix: string;
  /** Prepended to node slugs and uniform names so nested instances don't collide. */
  slugPrefix: string;
  /** Prepended to each uniform's `originalPath` so nested config reads work. */
  pathPrefix: readonly string[];
  /**
   * Pin-id → GLSL expression. When provided, the graph's GroupInput emits
   * direct assignments to these expressions instead of reading uniforms. This
   * is how a parent group node flows values into its subgraph.
   */
  inputBindings?: Record<string, string>;
}

interface SubgraphResult {
  /** GLSL statements in topo order. */
  statements: string[];
  /** Per-output-pin expression (i.e. the inner GroupOutput's incoming exprs). */
  outputExpressions: Record<string, string>;
  /** Pin specs of the inner GroupOutput, parallel to `outputExpressions` keys. */
  outputPins: readonly PinSpec[];
  dependencies: Set<GlslHelperName>;
  uniforms: ExtraUniformDecl[];
}

/**
 * Produce the fragment-body GLSL for a NodeGraph.
 *
 * Contract:
 *   - Exactly one GroupOutput node must be present; its `color`/`alpha` inputs
 *     drive the final `return vec4(<color>, <alpha>);`. If absent, a black frame
 *     is returned — the graph is incomplete but does not error.
 *   - Cycles are rejected with a clear error (graphs are DAGs).
 *   - Nodes unreachable from GroupOutput are silently dropped.
 *   - Group nodes (typeId "group") are expanded inline by recursing into their
 *     `config.subGraph`. The recursion threads a slug prefix and originalPath
 *     prefix so nested locals and uniforms stay unique and addressable.
 */
export function emitGraph(graph: NodeGraph, opts: EmitOptions): EmittedGraph {
  const result = emitGraphInto(graph, {
    containerPrefix: opts.containerPrefix,
    slugPrefix: "",
    pathPrefix: ["graph"],
  });

  const colorExpr = result.outputExpressions.color ?? "vec3(0.0)";
  const alphaExpr = result.outputExpressions.alpha ?? "1.0";

  return {
    main: `${result.statements.join("\n")}\nreturn vec4(${colorExpr}, ${alphaExpr});`,
    dependencies: Array.from(result.dependencies),
    uniforms: result.uniforms,
  };
}

function emitGraphInto(graph: NodeGraph, opts: EmitGraphIntoOpts): SubgraphResult {
  const groupOutput = graph.nodes.find((n) => n.typeId === GROUP_OUTPUT_TYPE_ID);
  if (!groupOutput) {
    return {
      statements: [],
      outputExpressions: {},
      outputPins: [],
      dependencies: new Set(),
      uniforms: [],
    };
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

  // Node-index lookup — used for `originalPath`, which walks into
  // `graph.nodes[index].config.<...>` to read the live value. Indexes refer to
  // `graph.nodes` at this recursion level; the path prefix supplies the outer
  // descent.
  const indexById = new Map(graph.nodes.map((n, i) => [n.id, i] as const));

  const resolved = new Map<string, ResolvedNode>();
  const uniforms: ExtraUniformDecl[] = [];
  const lines: string[] = [];
  const deps = new Set<GlslHelperName>();

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    const prim = requirePrimitive(node.typeId);
    const inputs = prim.inputs(node.config);
    const outputs = prim.outputs(node.config);
    const slug = `${opts.slugPrefix}${sanitizeName(node.id)}`;
    const outputLocals: Record<string, string> = {};
    for (const pin of outputs) {
      outputLocals[pin.id] = `n_${slug}_${pin.id}`;
    }

    // --- Special case: nested GroupInput. Bound by a parent group node, so
    // emit direct assignments to the parent's input expressions instead of
    // uniform reads. Uniforms aren't contributed at this depth — they'd be
    // orphan locations the property pane can't drive.
    if (node.typeId === GROUP_INPUT_TYPE_ID && opts.inputBindings) {
      const stmtLines: string[] = [];
      for (const pin of outputs) {
        const local = outputLocals[pin.id];
        const bound = opts.inputBindings[pin.id];
        const override = node.pinValues?.[pin.id];
        const expr = bound ?? glslLiteral(pin.type, override ?? pin.default);
        stmtLines.push(`${glslTypeOf(pin.type)} ${local} = ${expr};`);
      }
      lines.push(`// ${node.typeId} (${node.id})`);
      lines.push(stmtLines.join("\n"));
      resolved.set(nodeId, { node, inputs, outputs, outputLocals, uniformNames: {}, uniformSpecs: [] });
      continue;
    }

    // --- Special case: group node. Recurse into config.subGraph.
    if (node.typeId === GROUP_TYPE_ID) {
      const inputExprs = resolveInputExprs(inputs, edgesByTarget.get(nodeId) ?? [], resolved, node);
      const sub = (node.config as { subGraph?: NodeGraph }).subGraph;
      const nodeIndex = indexById.get(nodeId) ?? 0;

      if (sub && Array.isArray(sub.nodes) && sub.nodes.length > 0) {
        const subResult = emitGraphInto(sub, {
          containerPrefix: opts.containerPrefix,
          slugPrefix: `${slug}_`,
          pathPrefix: [...opts.pathPrefix, "nodes", String(nodeIndex), "config", "subGraph"],
          inputBindings: inputExprs,
        });
        lines.push(`// group (${node.id})`);
        lines.push(...subResult.statements);
        // Alias each external output to the inner GroupOutput's pin expression
        // so downstream consumers can read `n_<group>_<pin>` like any other node.
        for (const pin of outputs) {
          const innerExpr =
            subResult.outputExpressions[pin.id] ?? glslLiteral(pin.type, pin.default);
          lines.push(`${glslTypeOf(pin.type)} ${outputLocals[pin.id]} = ${innerExpr};`);
        }
        for (const dep of subResult.dependencies) deps.add(dep);
        uniforms.push(...subResult.uniforms);
      } else {
        // Empty / missing subgraph: feed each external output its default.
        for (const pin of outputs) {
          lines.push(
            `${glslTypeOf(pin.type)} ${outputLocals[pin.id]} = ${glslLiteral(pin.type, pin.default)};`,
          );
        }
      }
      resolved.set(nodeId, { node, inputs, outputs, outputLocals, uniformNames: {}, uniformSpecs: [] });
      continue;
    }

    // --- Standard primitive path.
    const uniformSpecs = prim.uniforms?.(node) ?? [];
    const uniformNames: Record<string, string> = {};
    const nodeIndex = indexById.get(nodeId) ?? 0;
    for (const u of uniformSpecs) {
      const name = `u_${opts.containerPrefix}_${slug}_${u.nameSuffix}`;
      uniformNames[u.nameSuffix] = name;
      const valuePath = u.valuePath ?? [u.nameSuffix];
      uniforms.push({
        nameSuffix: `${slug}_${u.nameSuffix}`,
        type: u.type,
        value: u.value,
        originalPath: [...opts.pathPrefix, "nodes", String(nodeIndex), "config", ...valuePath],
        originalName: `${prim.name} · ${u.nameSuffix}`,
      });
    }

    resolved.set(nodeId, { node, inputs, outputs, outputLocals, uniformNames, uniformSpecs });

    // GroupOutput contributes no statements at any depth — its expressions are
    // surfaced via `outputExpressions` (root: wrapped into `return vec4(...)`;
    // nested: aliased into the parent group's external output locals). Skipping
    // its emit also avoids the `_final_color` / `_final_alpha` sentinel locals
    // colliding when groups are nested inside groups.
    if (node.typeId === GROUP_OUTPUT_TYPE_ID) continue;

    const inputExprs = resolveInputExprs(inputs, edgesByTarget.get(nodeId) ?? [], resolved, node);

    const result = prim.emit({
      inputs: inputExprs,
      outputs: outputLocals,
      uniforms: uniformNames,
      config: node.config,
      addDependency: (name) => deps.add(name),
    });

    lines.push(`// ${node.typeId} (${node.id})`);
    lines.push(result.statements.trim());
  }

  // Surface the GroupOutput's per-pin expressions to the caller.
  const goResolved = resolved.get(groupOutput.id);
  const goIncoming = edgesByTarget.get(groupOutput.id) ?? [];
  const outputExpressions: Record<string, string> = {};
  let outputPins: readonly PinSpec[] = [];
  if (goResolved) {
    outputPins = goResolved.inputs;
    for (const pin of goResolved.inputs) {
      outputExpressions[pin.id] = extractFinalPin(goResolved, goIncoming, resolved, pin.id);
    }
  }

  return { statements: lines, outputExpressions, outputPins, dependencies: deps, uniforms };
}

/**
 * Resolve each input pin to a GLSL expression: upstream local if wired, else
 * a literal from `pinValues` override or the pin's static default. Used by
 * standard primitives and by the group-node path to compute the bindings it
 * forwards into the subgraph.
 */
function resolveInputExprs(
  inputs: readonly PinSpec[],
  incoming: readonly Edge[],
  resolved: Map<string, ResolvedNode>,
  node: GraphNode,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pin of inputs) {
    const edge = incoming.find((e) => e.toPin === pin.id);
    if (edge) {
      const upstream = resolved.get(edge.fromNodeId);
      const local = upstream?.outputLocals[edge.fromPin];
      if (local && upstream) {
        // Apply implicit coercion when the upstream pin's type/subtype
        // differs from this pin's. Same-type edges pass through unchanged.
        const upstreamPin = upstream.outputs.find((p) => p.id === edge.fromPin);
        if (upstreamPin) {
          const c = coerce(local, upstreamPin, pin);
          result[pin.id] = c.ok ? c.expr : local;
        } else {
          result[pin.id] = local;
        }
        continue;
      }
    }
    const override = node.pinValues?.[pin.id];
    result[pin.id] = glslLiteral(pin.type, override ?? pin.default);
  }
  return result;
}

/**
 * Extract a GroupOutput pin's upstream expression, or fall back to the pin's
 * declared default literal when nothing is wired. Reading the upstream local
 * directly (rather than the sentinel `_final_*` written by the primitive)
 * skips one assignment and keeps the emitted GLSL one line shorter.
 */
function extractFinalPin(
  groupOutput: ResolvedNode,
  incoming: Edge[],
  resolved: Map<string, ResolvedNode>,
  pinId: string,
): string {
  const edge = incoming.find((e) => e.toPin === pinId);
  if (!edge) {
    const pin = groupOutput.inputs.find((p) => p.id === pinId);
    if (!pin) return "0.0";
    const override = groupOutput.node.pinValues?.[pinId];
    return glslLiteral(pin.type, override ?? pin.default);
  }
  const upstream = resolved.get(edge.fromNodeId);
  return upstream?.outputLocals[edge.fromPin] ?? "0.0";
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
