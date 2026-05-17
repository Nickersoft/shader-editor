<script lang="ts">
  import {
    isPointControl,
    isRadiusControl,
    isSegmentControl,
    resolveSpatialControls,
  } from "@/shaders/core/spatial";
  import { composer } from "@/lib/state/composer.svelte";
  import { SvelteResizeObserver } from "@/lib/reactivity/resize-observer";
  import type { Point, Size } from "@/lib/types";
  import {
    aggregateGraphSpatialControls,
    parseGraphAddress,
  } from "@/shaders/node-graph";
  import { isProceduralShader } from "@/shaders/core/procedural-shader.svelte";

  import { hasSpatialControls } from "./guards";
  import {
    BoundingBoxControl,
    PointControl,
    PolygonControl,
    RadiusControl,
    SegmentControl,
    TransformControl,
    setOverlayContext,
    type CanvasOverlayContext,
  } from "./controls";
  import type { Layer } from "@/shaders/core/layer.svelte";
  import { EMPTY_CONFIG } from "./consts";
  import { controlKey } from "./utils";

  interface Props {
    canvas: HTMLCanvasElement | null;
    layer: Layer | null;
  }

  let { canvas, layer }: Props = $props();

  const resizeObserver = $derived(new SvelteResizeObserver(canvas));

  const size = $derived<Size>({
    w: resizeObserver.width,
    h: resizeObserver.height,
  });

  const cls = $derived(layer?.source.cls);

  // Spatial control values (x/y/w/h/rotation, gradient endpoints, etc.) live
  // on `inputs` — the single live value bag on the Shader instance.
  const inputs = $derived(
    (layer?.source.inputs as Record<string, unknown> | undefined) ?? EMPTY_CONFIG,
  );

  // ProceduralShader sources don't carry spatial controls on their class; we
  // walk the graph and aggregate per-primitive declarations, rewriting their
  // field references with graph:<nodeId>: prefixes. Other shaders still use
  // the class-static path.
  const procField = $derived(
    layer && isProceduralShader(layer.source) ? layer.source : null,
  );

  const controls = $derived.by(() => {
    if (procField) return aggregateGraphSpatialControls(procField.graph);
    if (cls && hasSpatialControls(cls)) {
      return resolveSpatialControls(cls.spatialControls, inputs);
    }
    return [];
  });

  const sourceId = $derived(layer?.source.id ?? "");

  /**
   * Read the live value of an address from the right backing store.
   * `graph:<idA>/<idB>/...:<key>` walks through each subGraph in turn to the
   * leaf node and reads `node.config[key]`; anything else reads from the
   * layer source's top-level `uniforms` bag (the legacy shape-node path).
   */
  function readAddr(addr: string): unknown {
    const parsed = parseGraphAddress(addr);
    if (parsed && procField) {
      const node = walkGraphPath(procField.graph, parsed.nodePath);
      return node?.config[parsed.key];
    }
    return inputs[addr];
  }

  /**
   * Mirror of `readAddr` for writes, with shared batching keyed by the joined
   * node path. The composer is then asked to apply each bucket as a single
   * batch mutation on the addressed graph node.
   */
  function writeAddrs(updates: Record<string, unknown>): void {
    const perNode = new Map<string, { nodePath: readonly string[]; bag: Record<string, unknown> }>();
    const inputUpdates: Record<string, unknown> = {};
    let hasInputUpdates = false;
    for (const addr in updates) {
      const parsed = parseGraphAddress(addr);
      if (parsed) {
        const key = parsed.nodePath.join("/");
        let entry = perNode.get(key);
        if (!entry) {
          entry = { nodePath: parsed.nodePath, bag: {} };
          perNode.set(key, entry);
        }
        entry.bag[parsed.key] = updates[addr];
      } else {
        inputUpdates[addr] = updates[addr];
        hasInputUpdates = true;
      }
    }
    if (hasInputUpdates) {
      composer.updateInputBatch(sourceId, inputUpdates);
    }
    for (const { nodePath, bag } of perNode.values()) {
      // Composer addresses graph nodes by their leaf id; nested-graph routing
      // happens internally via the composer's edit stack.
      const leaf = nodePath[nodePath.length - 1];
      if (leaf) composer.updateGraphNodeConfigBatch(sourceId, leaf, bag);
    }
  }

  /**
   * Walk a node-path from a graph's root down through each group node's
   * `config.subGraph`. Returns the leaf node or null if any step fails to
   * resolve (e.g. the addressed group has been deleted or its subgraph
   * cleared).
   */
  function walkGraphPath(rootGraph: { nodes: { id: string; typeId: string; config: Record<string, unknown> }[] }, nodePath: readonly string[]) {
    if (nodePath.length === 0) return null;
    let graph: { nodes: { id: string; typeId: string; config: Record<string, unknown> }[] } = rootGraph;
    for (let i = 0; i < nodePath.length; i++) {
      const node = graph.nodes.find((n) => n.id === nodePath[i]);
      if (!node) return null;
      if (i === nodePath.length - 1) return node;
      const sub = (node.config as { subGraph?: typeof rootGraph }).subGraph;
      if (!sub) return null;
      graph = sub;
    }
    return null;
  }

  const ctx: CanvasOverlayContext = {
    get config() {
      return inputs;
    },
    get size() {
      return size;
    },
    toPx(uv: Point): Point {
      return { x: uv.x * size.w, y: (1 - uv.y) * size.h };
    },
    fromPx(px: Point): Point {
      return { x: px.x / size.w, y: 1 - px.y / size.h };
    },
    radiusToPx(r: number): number {
      return r * size.h;
    },
    radiusFromPx(rPx: number): number {
      return rPx / size.h;
    },
    read(key) {
      return readAddr(key);
    },
    readNumber(key, fallback = 0) {
      const value = readAddr(key);
      return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
    },
    setField(key, value) {
      writeAddrs({ [key]: value });
    },
    setFields(updates) {
      writeAddrs(updates);
    },
  };

  setOverlayContext(ctx);
</script>

{#if layer && size.w > 0 && size.h > 0 && controls.length > 0}
  <svg
    class="absolute inset-0 pointer-events-none"
    width={size.w}
    height={size.h}
    viewBox={`0 0 ${size.w} ${size.h}`}
    preserveAspectRatio="none"
  >
    {#each controls as c, idx (controlKey(c, idx))}
      {#if isPointControl(c)}
        <PointControl control={c} />
      {:else if isRadiusControl(c)}
        <RadiusControl control={c} />
      {:else if isSegmentControl(c)}
        <SegmentControl control={c} />
      {:else if c.kind === "transform"}
        <TransformControl control={c} />
      {:else if c.kind === "boundingBox"}
        <BoundingBoxControl control={c} />
      {:else if c.kind === "polygon"}
        <PolygonControl control={c} />
      {/if}
    {/each}
  </svg>
{/if}
