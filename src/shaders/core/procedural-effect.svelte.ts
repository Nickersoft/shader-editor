// ProceduralEffect — effect shader whose body is a node graph rather than
// hand-written GLSL. Mirrors `ProceduralShader` on the effect side.
//
//   class ColorAdjust extends ProceduralEffect {
//     static readonly typeId = "color-adjust";
//     static readonly meta: ShaderMeta = { name: "Color Adjust", category: "adjustments", ... };
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
  Effect,
  type SerializedShader,
  type ShaderClass,
  type ShaderInit,
} from "./shader.svelte";
import type { GlslBlock } from "./types";

/**
 * Static contract every ProceduralEffect subclass must satisfy. The
 * registry-visible bits inherit from `ShaderClass`; the factory adds the
 * `graph()` requirement.
 */
export interface ProceduralEffectClass<T extends ProceduralEffect = ProceduralEffect>
  extends ShaderClass<T> {
  graph(): NodeGraph;
}

/**
 * Effect whose body is a node graph. Subclasses declare `static graph(): NodeGraph`
 * — same factory contract as `ProceduralShader`. The effect signature
 * (`vec4 base` input, optional multi-pass via `GlslBlock[]`) is inherited
 * from `Effect`, but graph-driven effects always emit one pass.
 */
export abstract class ProceduralEffect extends Effect<{ graph: NodeGraph }> {
  graph = $state<NodeGraph>({ nodes: [], edges: [] });

  constructor(init: ShaderInit = {}) {
    super(init);

    const cls = this.constructor as unknown as ProceduralEffectClass;
    if (typeof cls.graph !== "function") {
      throw new Error(
        `${cls.name}: ProceduralEffect subclass must declare 'static graph(): NodeGraph'`,
      );
    }

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

  protected parseInputs(init: ShaderInit): { graph: NodeGraph } {
    const persisted = (init.inputs as { graph?: NodeGraph } | undefined)?.graph;
    return { graph: persisted ?? { nodes: [], edges: [] } };
  }

  structuralKey(): string {
    return graphStructuralKey(this.graph);
  }

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

/** Type guard for ProceduralEffect instances. */
export function isProceduralEffect(value: unknown): value is ProceduralEffect {
  return value instanceof ProceduralEffect;
}
