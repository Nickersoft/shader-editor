<script lang="ts" module>
  // Per-row and footer pixel heights. Exported so the parent node component
  // can budget vertical space for input handles below this editor without
  // re-declaring constants that would silently desync on tweaks.
  export const ACC_ROW_H = 28;
  export const ACC_FOOTER_H = 26;

  export function accumulatorBlockHeight(rowCount: number): number {
    return rowCount * ACC_ROW_H + ACC_FOOTER_H;
  }
</script>

<script lang="ts">
  // Inline editor for an iterate node's `accumulators` config. Mirrors the
  // row layout used by graph-group-input-node so the two custom inline
  // editors feel consistent. After every mutation we call
  // `syncIterateSubgraphPins` so the inner GroupInput / GroupOutput stay
  // aligned with the accumulator set — that helper also prunes orphan edges
  // for vanished pins.

  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash-2";

  import { composer } from "@/lib/state/composer.svelte";
  import {
    accumulatorInPinId,
    accumulatorOutPinId,
    syncIterateSubgraphPins,
    type AccumulatorSpec,
  } from "@/shaders/node-graph";

  type AccumType = AccumulatorSpec["type"];

  const ACCUM_TYPES: readonly AccumType[] = ["float", "vec2", "vec3", "vec4"];

  let { nodeId, accumulators }: { nodeId: string; accumulators: AccumulatorSpec[] } = $props();

  function initialFor(type: AccumType): unknown {
    switch (type) {
      case "vec2":
        return [0, 0];
      case "vec3":
        return [0, 0, 0];
      case "vec4":
        return [0, 0, 0, 0];
      case "float":
      default:
        return 0;
    }
  }

  function withNode(fn: (node: { id: string; config: Record<string, unknown> }) => void) {
    const layerId = composer.editingTextureLayerId;
    if (!layerId) return;
    const graph = composer.activeGraphFor(layerId);
    if (!graph) return;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    fn(node);
    // Sync unconditionally — idempotent and lets callers (e.g. rename, which
    // also rewrites inner edges) skip mutating the accumulators list when
    // only side state changed.
    syncIterateSubgraphPins(node);
  }

  function addAccumulator() {
    withNode((node) => {
      const cfg = node.config as { accumulators?: AccumulatorSpec[] };
      const current = Array.isArray(cfg.accumulators) ? cfg.accumulators : [];
      const existing = new Set(current.map((a) => a.name));
      let i = current.length + 1;
      let name = `acc${i}`;
      while (existing.has(name)) {
        i += 1;
        name = `acc${i}`;
      }
      cfg.accumulators = [...current, { name, type: "float", initial: 0 }];
    });
  }

  function removeAccumulator(index: number) {
    withNode((node) => {
      const cfg = node.config as { accumulators?: AccumulatorSpec[] };
      const current = Array.isArray(cfg.accumulators) ? cfg.accumulators : [];
      cfg.accumulators = current.filter((_, i) => i !== index);
    });
  }

  function renameAccumulator(index: number, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    withNode((node) => {
      const cfg = node.config as { accumulators?: AccumulatorSpec[] };
      const current = Array.isArray(cfg.accumulators) ? cfg.accumulators : [];
      const target = current[index];
      if (!target || target.name === trimmed) return;
      // Duplicate-name guard — silently no-op on collision rather than
      // throwing, matching graph-group-input-node's renameId behaviour.
      if (current.some((a, i) => i !== index && a.name === trimmed)) return;

      // Rewrite inner edges that reference the *_in / *_out pins so the
      // rename survives the sync's pin-id rewrite (otherwise they'd be
      // dropped as orphans).
      const sub = (
        node.config as {
          subGraph?: {
            edges?: { fromNodeId: string; fromPin: string; toNodeId: string; toPin: string }[];
          };
        }
      ).subGraph;
      if (sub?.edges) {
        const oldIn = accumulatorInPinId(target.name);
        const newIn = accumulatorInPinId(trimmed);
        const oldOut = accumulatorOutPinId(target.name);
        const newOut = accumulatorOutPinId(trimmed);
        sub.edges = sub.edges.map((e) => ({
          ...e,
          fromPin: e.fromPin === oldIn ? newIn : e.fromPin,
          toPin: e.toPin === oldOut ? newOut : e.toPin,
        }));
      }

      const next = [...current];
      next[index] = { ...target, name: trimmed };
      cfg.accumulators = next;
    });
  }

  function moveAccumulator(from: number, to: number) {
    withNode((node) => {
      const cfg = node.config as { accumulators?: AccumulatorSpec[] };
      const current = Array.isArray(cfg.accumulators) ? cfg.accumulators : [];
      if (from < 0 || from >= current.length) return;
      if (to < 0 || to >= current.length) return;
      if (from === to) return;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      cfg.accumulators = next;
    });
  }

  // Drag-reorder state. The grip on each row is the only `draggable=true`
  // element, so xyflow's pointer drag (suppressed via `nodrag` on the row)
  // and the HTML5 drag don't compete. Mirrors graph-group-input-node.svelte.
  let draggingIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  function handleDragStart(i: number, e: DragEvent) {
    draggingIndex = i;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // A payload is required for Firefox to fire `drop`.
      e.dataTransfer.setData("text/plain", String(i));
    }
  }

  function handleDragOver(i: number, e: DragEvent) {
    if (draggingIndex === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== i) dragOverIndex = i;
  }

  function handleDrop(i: number, e: DragEvent) {
    e.preventDefault();
    const from = draggingIndex;
    draggingIndex = null;
    dragOverIndex = null;
    if (from === null || from === i) return;
    moveAccumulator(from, i);
  }

  function handleDragEnd() {
    draggingIndex = null;
    dragOverIndex = null;
  }

  function retypeAccumulator(index: number, newType: AccumType) {
    withNode((node) => {
      const cfg = node.config as { accumulators?: AccumulatorSpec[] };
      const current = Array.isArray(cfg.accumulators) ? cfg.accumulators : [];
      const target = current[index];
      if (!target || target.type === newType) return;
      // Type change resets `initial` — a vec3 default can't survive a
      // switch to float without invalidating downstream literals.
      const next = [...current];
      next[index] = { ...target, type: newType, initial: initialFor(newType) };
      cfg.accumulators = next;
    });
  }
</script>

<div class="border-t border-white/10 bg-white/[0.02]">
  {#each accumulators as acc, i (acc.name)}
    {@const isDragging = draggingIndex === i}
    {@const isDropTarget = draggingIndex !== null && dragOverIndex === i && draggingIndex !== i}
    {@const dropAbove = isDropTarget && (draggingIndex ?? -1) > i}
    {@const dropBelow = isDropTarget && (draggingIndex ?? -1) < i}
    <div
      class="nodrag relative flex items-center gap-1 pr-2 pl-1 text-[11px] text-white/70 transition-opacity"
      class:opacity-40={isDragging}
      style:height="{ACC_ROW_H}px"
      ondragover={(e) => handleDragOver(i, e)}
      ondrop={(e) => handleDrop(i, e)}
      ondragend={handleDragEnd}
      role="listitem"
    >
      {#if dropAbove}
        <span
          class="pointer-events-none absolute top-0 right-2 left-2 h-0.5 rounded bg-indigo-400"
          aria-hidden="true"
        ></span>
      {/if}
      {#if dropBelow}
        <span
          class="pointer-events-none absolute right-2 bottom-0 left-2 h-0.5 rounded bg-indigo-400"
          aria-hidden="true"
        ></span>
      {/if}
      <button
        class="cursor-grab p-0.5 text-white/30 hover:text-white active:cursor-grabbing"
        draggable="true"
        ondragstart={(e) => handleDragStart(i, e)}
        aria-label="Drag to reorder accumulator"
        title="Drag to reorder"
      >
        <GripVertical class="size-3" />
      </button>
      <input
        class="min-w-0 flex-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-white hover:bg-white/10 focus:bg-white/10 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none"
        value={acc.name}
        onchange={(e) => renameAccumulator(i, (e.currentTarget as HTMLInputElement).value)}
        aria-label="Accumulator name"
        title="Accumulator name — drives the inner pin ids: ${acc.name}_in / ${acc.name}_out"
      />
      <select
        class="rounded bg-white/5 px-1 py-0.5 text-[10px] text-white/70 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
        value={acc.type}
        onchange={(e) =>
          retypeAccumulator(i, (e.currentTarget as HTMLSelectElement).value as AccumType)}
        aria-label="Accumulator type"
      >
        {#each ACCUM_TYPES as t (t)}
          <option value={t}>{t}</option>
        {/each}
      </select>
      <button
        class="p-0.5 text-white/30 hover:text-red-400"
        onclick={() => removeAccumulator(i)}
        aria-label="Remove accumulator"
        title="Remove accumulator"
      >
        <Trash class="size-2.5" />
      </button>
    </div>
  {/each}

  <button
    class="nodrag flex w-full items-center justify-center gap-1.5 border-t border-white/10 text-[11px] text-white/40 hover:bg-white/5 hover:text-white"
    style:height="{ACC_FOOTER_H}px"
    onclick={addAccumulator}
    title="Add an accumulator threaded across iterations"
  >
    <Plus class="size-3" />
    <span>Add accumulator</span>
  </button>
</div>
