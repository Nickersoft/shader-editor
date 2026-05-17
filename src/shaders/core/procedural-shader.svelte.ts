// ProceduralShader — generator shader whose body is a node graph rather than
// hand-written GLSL. Mirrors `ProceduralShader` on the new Shader hierarchy:
// owns a reactive `graph: NodeGraph`, auto-implements `glsl()` + uniform
// emission via `emitGraph`, and serialises the graph alongside the rest of
// the instance so user customisations round-trip.
//
// Subclasses register their own typeId, supply `static meta`, and declare a
// `static graph(): NodeGraph` factory that builds the preset's DAG (typically
// via `GraphBuilder`). The graph's GroupInput declares the layer's
// user-facing parameters; the property pane reads & writes those pin defaults.
//
//   class Aurora extends ProceduralShader {
//     static readonly typeId = "aurora";
//     static readonly meta: ShaderMeta = { name: "Aurora", category: "textures", ... };
//     static graph(): NodeGraph {
//       const b = new GraphBuilder();
//       // ...
//       return b.output(mix);
//     }
//   }

import type { ExtraUniformDecl } from "@/lib/codegen/types";
import { type NodeGraph } from "@/shaders/node-graph";

import { cloneGraph, GraphEmitCache, graphStructuralKey } from "./graph-shader-helpers";
import {
  Shader,
  type SerializedShader,
  type ShaderClass,
  type ShaderInit,
} from "./shader.svelte";
import type { GlslBlock } from "./types";

/**
 * Static contract every ProceduralShader subclass must satisfy. The
 * registry-visible bits inherit from `ShaderClass`; the factory adds the
 * `graph()` requirement.
 */
export interface ProceduralShaderClass<T extends ProceduralShader = ProceduralShader>
  extends ShaderClass<T> {
  graph(): NodeGraph;
}

/**
 * Generator shader whose body is a node graph. Pair with `register(MyClass)`
 * in the same module so the registry can hydrate the typeId from saved scenes.
 *
 * Subclasses must declare `static graph(): NodeGraph` — the default factory
 * used to seed the instance's editable graph on first construction. Saved
 * scenes whose persisted graph is non-empty skip the factory; the persisted
 * graph is migrated and adopted instead, so user customisations survive
 * reloads.
 */
export abstract class ProceduralShader extends Shader<{ graph: NodeGraph }> {
  /**
   * Live, editable graph state. Mutating the graph triggers downstream
   * recompile via `structuralKey()`. Held on the instance (not under
   * `this.inputs`) because the graph *is* the entire input — there are no
   * scalar fields alongside.
   */
  graph = $state<NodeGraph>({ nodes: [], edges: [] });

  constructor(init: ShaderInit = {}) {
    super(init);

    const cls = this.constructor as unknown as ProceduralShaderClass;
    if (typeof cls.graph !== "function") {
      throw new Error(
        `${cls.name}: ProceduralShader subclass must declare 'static graph(): NodeGraph'`,
      );
    }

    // Hydrate from serialized form when present; otherwise seed from the
    // subclass's `static graph()` factory.
    const persisted = this.inputs.graph;
    if (
      persisted &&
      Array.isArray(persisted.nodes) &&
      Array.isArray(persisted.edges) &&
      persisted.nodes.length > 0
    ) {
      this.graph = cloneGraph(persisted);
    } else {
      this.graph = cls.graph();
    }
  }

  /**
   * Shader's default `parseInputs` returns `{}` — ProceduralShader's input is
   * the graph itself, so we override to pull it out of `init.inputs.graph`.
   */
  protected parseInputs(init: ShaderInit): { graph: NodeGraph } {
    const persisted = (init.inputs as { graph?: NodeGraph } | undefined)?.graph;
    return { graph: persisted ?? { nodes: [], edges: [] } };
  }

  /**
   * Structural fingerprint — folded into the scene's rebuild key. Walks the
   * graph topology and excludes each primitive's live-uniform paths so
   * uniform edits stay live (no recompile).
   */
  structuralKey(): string {
    return graphStructuralKey(this.graph);
  }

  // Per-instance emit cache: `extraUniforms()` and `glsl()` share one emit
  // pass per rebuild key.
  private cache = new GraphEmitCache();

  extraUniforms(): ExtraUniformDecl[] {
    return this.cache.get(this.graph, this.prefix).uniforms;
  }

  glsl(): GlslBlock {
    const emitted = this.cache.get(this.graph, this.prefix);
    return {
      dependencies: emitted.dependencies,
      main: emitted.main,
    };
  }

  toJSON(): SerializedShader {
    const base = super.toJSON();
    return {
      ...base,
      inputs: { ...base.inputs, graph: cloneGraph(this.graph) },
    };
  }
}

/** Type guard for ProceduralShader instances. */
export function isProceduralShader(value: unknown): value is ProceduralShader {
  return value instanceof ProceduralShader;
}
