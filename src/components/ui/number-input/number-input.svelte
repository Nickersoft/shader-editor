<script lang="ts">
  import { cn } from "@/lib/utils";

  interface Props {
    value: number;
    /** Fires on every interim change — typically used for live display. */
    onChange: (value: number) => void;
    /**
     * Fires when the user commits a value: drag-end, Enter/blur from typed
     * edit, or each arrow-key step. Used to gate expensive side effects
     * (e.g. a shader recompile) to discrete commits only. If omitted, the
     * input behaves identically to passing `onChange` for both.
     */
    onCommit?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Decimal places to display. Defaults to 0 when step >= 1, otherwise 2. */
    precision?: number;
    /** Round committed values to integers. */
    integer?: boolean;
    /** Short prefix (e.g. "X", "W"). Also the drag-to-scrub handle. */
    label?: string;
    /** Optional trailing text (e.g. "%", "px"). */
    suffix?: string;
    /** Value units the scrub moves per pixel of drag. Default = `step`. */
    sensitivity?: number;
    class?: string;
  }

  let {
    value,
    onChange,
    onCommit,
    min = -Infinity,
    max = Infinity,
    step = 1,
    precision,
    integer = false,
    label,
    suffix,
    sensitivity,
    class: className,
  }: Props = $props();

  let inputEl = $state<HTMLInputElement | null>(null);
  let editing = $state(false);
  let draftText = $state("");
  let drag = $state<{
    pointerId: number;
    startX: number;
    startValue: number;
    captureEl: HTMLElement;
    moved: boolean;
  } | null>(null);

  let displayPrecision = $derived(
    integer ? 0 : (precision ?? (step >= 1 ? 0 : 2)),
  );
  let scrubUnit = $derived(sensitivity ?? step);

  function clamp(v: number): number {
    if (!Number.isFinite(v)) return value;
    return Math.min(max, Math.max(min, v));
  }

  function format(v: number): string {
    return v.toFixed(displayPrecision);
  }

  function commit(next: number) {
    let n = clamp(next);
    if (integer) n = Math.round(n);
    if (n !== value) onChange(n);
    return n;
  }

  function startDrag(e: PointerEvent) {
    if (editing || e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startValue: value,
      captureEl: target,
      moved: false,
    };
  }

  function onDragMove(e: PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < 2) return;
    drag.moved = true;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    commit(drag.startValue + dx * scrubUnit * mult);
  }

  function endDrag(e: PointerEvent) {
    if (!drag) return;
    try {
      drag.captureEl.releasePointerCapture(drag.pointerId);
    } catch {}
    const wasDrag = drag.moved;
    drag = null;
    if (!wasDrag) {
      enterEdit();
      return;
    }
    // Drag ended on a real scrub — fire the commit hook so callers that
    // gate expensive side effects (shader recompile) only pay at scrub-end.
    onCommit?.(value);
  }

  function enterEdit() {
    editing = true;
    draftText = format(value);
    queueMicrotask(() => {
      inputEl?.focus();
      inputEl?.select();
    });
  }

  function exitEdit(commitDraft: boolean) {
    if (commitDraft) {
      const parsed = parseFloat(draftText);
      if (Number.isFinite(parsed)) {
        const n = commit(parsed);
        onCommit?.(n);
      }
    }
    editing = false;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      exitEdit(true);
      inputEl?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      exitEdit(false);
      inputEl?.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const mult = e.shiftKey ? 10 : 1;
      const base = parseFloat(draftText);
      const next = (Number.isFinite(base) ? base : value) + dir * step * mult;
      const clamped = integer ? Math.round(clamp(next)) : clamp(next);
      draftText = format(clamped);
      const n = commit(clamped);
      // Each arrow-key press is a discrete commit — fire the hook so
      // recompile-gated callers see one bake per keypress.
      onCommit?.(n);
      inputEl?.select();
    }
  }
</script>

<svelte:window
  onpointermove={onDragMove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
/>

<div
  class={cn(
    "flex items-center h-7 px-1.5 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)] text-xs select-none transition-colors",
    "ring-1 ring-inset ring-transparent focus-within:ring-[rgba(255,255,255,0.18)] focus-within:bg-[rgba(255,255,255,0.07)]",
    className,
  )}
>
  {#if label}
    <span
      role="slider"
      tabindex="-1"
      aria-label="Drag to change {label}"
      aria-valuenow={value}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      class="text-white/45 font-medium px-1 cursor-ew-resize touch-none truncate shrink min-w-0"
      onpointerdown={startDrag}
    >
      {label}
    </span>
  {/if}
  {#if editing}
    <input
      bind:this={inputEl}
      type="text"
      inputmode="decimal"
      class="flex-1 bg-transparent outline-none text-white font-mono w-0 min-w-0 px-1 tabular-nums {label ? 'text-right' : 'text-left'}"
      bind:value={draftText}
      onkeydown={onKey}
      onblur={() => exitEdit(true)}
    />
  {:else}
    <button
      type="button"
      class="flex-1 bg-transparent text-white font-mono tabular-nums px-1 truncate min-w-0 {label ? 'text-right cursor-text' : 'text-left cursor-ew-resize'}"
      onpointerdown={label ? undefined : startDrag}
      onclick={label ? enterEdit : undefined}
      tabindex="0"
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enterEdit();
        }
      }}
    >
      {format(value)}
    </button>
  {/if}
  {#if suffix}
    <span class="text-white/40 pl-0.5 pr-1 shrink-0">{suffix}</span>
  {/if}
</div>
