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
  import { ProceduralField } from "@/shaders/textures/procedural-field.svelte";

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
  // on `uniforms` — that's the GPU-bound state. `config` carries structural
  // switches that don't drive overlay handles, so we feed `uniforms` to
  // both the resolver and the read/write paths.
  const uniforms = $derived(layer?.source.uniforms ?? EMPTY_CONFIG);

  // ProceduralField sources don't carry spatial controls on their class; we
  // walk the graph and aggregate per-primitive declarations, rewriting their
  // field references with graph:<nodeId>: prefixes. Shape nodes still use the
  // legacy class-static path.
  const procField = $derived(
    layer?.source instanceof ProceduralField ? layer.source : null,
  );

  const controls = $derived.by(() => {
    if (procField) return aggregateGraphSpatialControls(procField.graph);
    if (cls && hasSpatialControls(cls)) {
      return resolveSpatialControls(cls.spatialControls, uniforms);
    }
    return [];
  });

  const sourceId = $derived(layer?.source.id ?? "");

  /**
   * Read the live value of an address from the right backing store.
   * `graph:<nodeId>:<key>` reads `node.config[key]` on the ProceduralField's
   * matching graph node; anything else reads from the layer source's
   * top-level `uniforms` bag (the legacy shape-node path).
   */
  function readAddr(addr: string): unknown {
    const parsed = parseGraphAddress(addr);
    if (parsed && procField) {
      const n = procField.graph.nodes.find((g) => g.id === parsed.nodeId);
      return n?.config[parsed.key];
    }
    return uniforms[addr];
  }

  /** Mirror of `readAddr` for writes, with shared batching by graph node. */
  function writeAddrs(updates: Record<string, unknown>): void {
    // Bucket per-graph-node writes so each graph node sees one batch mutation;
    // plain uniform writes accumulate into a single uniform-batch call.
    const perNode = new Map<string, Record<string, unknown>>();
    const uniformUpdates: Record<string, unknown> = {};
    let hasUniformUpdates = false;
    for (const addr in updates) {
      const parsed = parseGraphAddress(addr);
      if (parsed) {
        let bag = perNode.get(parsed.nodeId);
        if (!bag) {
          bag = {};
          perNode.set(parsed.nodeId, bag);
        }
        bag[parsed.key] = updates[addr];
      } else {
        uniformUpdates[addr] = updates[addr];
        hasUniformUpdates = true;
      }
    }
    if (hasUniformUpdates) {
      composer.updateUniformBatch(sourceId, uniformUpdates);
    }
    for (const [nodeId, bag] of perNode) {
      composer.updateGraphNodeConfigBatch(sourceId, nodeId, bag);
    }
  }

  const ctx: CanvasOverlayContext = {
    get config() {
      return uniforms;
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
