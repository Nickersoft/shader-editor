<script lang="ts">
  import * as Popover from "@/components/ui/popover";
  import { cn } from "@/lib/utils";
  import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from "@/lib/color";
  import { NumberInput } from "@/components/ui/number-input";

  interface Props {
    /** [r, g, b] or [r, g, b, a] — channels in 0..1 linear space. */
    value: number[];
    onChange: (value: number[]) => void;
    /** Fires on commit only (drag-end, Enter/blur, picker close). */
    onCommit?: (value: number[]) => void;
    /** When true, the value is treated as vec4 and an alpha slider appears. */
    alpha?: boolean;
    class?: string;
  }

  let {
    value,
    onChange,
    onCommit,
    alpha = false,
    class: className,
  }: Props = $props();

  // HSV is the picker's source of truth while the user interacts, because
  // RGB→HSV loses hue when saturation or value is 0. Reseed from external
  // value only when the change wasn't emitted by us.
  let h = $state(0);
  let s = $state(0);
  let v = $state(0);
  let a = $state(1);
  let hexDraft = $state<string | null>(null);
  let lastEmittedKey = $state("");

  function key(r: number, g: number, b: number, al: number): string {
    return `${r.toFixed(6)},${g.toFixed(6)},${b.toFixed(6)},${al.toFixed(6)}`;
  }

  $effect(() => {
    const r = value[0] ?? 0;
    const g = value[1] ?? 0;
    const b = value[2] ?? 0;
    const al = alpha ? (value[3] ?? 1) : 1;
    if (key(r, g, b, al) === lastEmittedKey) return;
    const [hh, ss, vv] = rgbToHsv(r, g, b);
    if (ss > 0) h = hh;
    s = ss;
    v = vv;
    a = al;
  });

  let rgb = $derived(hsvToRgb(h, s, v));
  let hex = $derived(rgbToHex(rgb[0], rgb[1], rgb[2]));
  let displayHex = $derived(hexDraft ?? hex);
  let cssRgb = $derived(
    `rgb(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)})`,
  );
  let cssRgba = $derived(
    `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${a})`,
  );
  let hueRgb = $derived(hsvToRgb(h, 1, 1));
  let cssHue = $derived(
    `rgb(${Math.round(hueRgb[0] * 255)}, ${Math.round(hueRgb[1] * 255)}, ${Math.round(hueRgb[2] * 255)})`,
  );

  function emit(commit = false) {
    const [r, g, b] = rgb;
    const next = alpha ? [r, g, b, a] : [r, g, b];
    lastEmittedKey = key(r, g, b, alpha ? a : 1);
    onChange(next);
    if (commit) onCommit?.(next);
  }

  function drag(
    el: HTMLElement,
    e: PointerEvent,
    update: (x: number, y: number) => void,
  ) {
    if (e.button !== 0) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const read = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      update(x, y);
    };
    read(e);
    emit();
    const move = (ev: PointerEvent) => {
      read(ev);
      emit();
    };
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {}
      emit(true);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  function onSVDown(e: PointerEvent) {
    drag(e.currentTarget as HTMLElement, e, (x, y) => {
      s = x;
      v = 1 - y;
    });
  }

  function onHueDown(e: PointerEvent) {
    drag(e.currentTarget as HTMLElement, e, (x) => {
      h = x * 360;
    });
  }

  function onAlphaDown(e: PointerEvent) {
    drag(e.currentTarget as HTMLElement, e, (x) => {
      a = x;
    });
  }

  function commitHex() {
    if (hexDraft == null) return;
    const parsed = hexToRgb(hexDraft);
    hexDraft = null;
    if (!parsed) return;
    const [r, g, b] = parsed;
    const [hh, ss, vv] = rgbToHsv(r, g, b);
    if (ss > 0) h = hh;
    s = ss;
    v = vv;
    emit(true);
  }
</script>

{#snippet thumb(x: number, y: number, bg: string)}
  <div
    class="absolute w-3.5 h-3.5 rounded-full ring-2 ring-white shadow pointer-events-none"
    style="left: {x * 100}%; top: {y *
      100}%; transform: translate(-50%, -50%);"
    style:background-color={bg}
  ></div>
{/snippet}

<div class={cn("flex items-center gap-1 min-w-0", className)}>
  <Popover.Root>
    <Popover.Trigger
      class="checker-bg relative h-7 w-9 shrink-0 rounded-md overflow-hidden ring-1 ring-inset ring-white/10 hover:ring-white/30 transition-shadow cursor-pointer outline-none focus-visible:ring-white/40"
      aria-label="Pick colour"
    >
      <span class="absolute inset-0" style:background-color={cssRgba}></span>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        align="start"
        sideOffset={6}
        class="z-50 w-60 flex flex-col gap-3"
      >
        <div
          role="slider"
          tabindex="-1"
          aria-label="Saturation and brightness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(s * 100)}
          aria-valuetext="S {Math.round(s * 100)}%, V {Math.round(v * 100)}%"
          class="relative h-40 w-full cursor-crosshair select-none touch-none"
          onpointerdown={onSVDown}
        >
          <div
            class="absolute inset-0 rounded-md overflow-hidden"
            style:background-color={cssHue}
          >
            <div
              class="absolute inset-0"
              style="background: linear-gradient(to right, #fff, transparent);"
            ></div>
            <div
              class="absolute inset-0"
              style="background: linear-gradient(to top, #000, transparent);"
            ></div>
          </div>
          {@render thumb(s, 1 - v, cssRgb)}
        </div>

        <div
          role="slider"
          tabindex="-1"
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(h)}
          class="relative h-3 w-full rounded-full cursor-pointer select-none touch-none"
          style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);"
          onpointerdown={onHueDown}
        >
          {@render thumb(h / 360, 0.5, cssHue)}
        </div>

        {#if alpha}
          <div
            role="slider"
            tabindex="-1"
            aria-label="Alpha"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(a * 100)}
            class="relative h-3 w-full cursor-pointer select-none touch-none"
            onpointerdown={onAlphaDown}
          >
            <div
              class="checker-bg absolute inset-0 rounded-full overflow-hidden"
            >
              <div
                class="absolute inset-0"
                style="background: linear-gradient(to right, transparent, {cssRgb});"
              ></div>
            </div>
            {@render thumb(a, 0.5, cssRgba)}
          </div>
        {/if}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>

  <input
    type="text"
    class="flex-1 min-w-0 h-7 px-2 rounded-md bg-white/4 hover:bg-white/7 focus:bg-white/7 outline-none ring-1 ring-inset ring-transparent focus:ring-white/18 text-xs font-mono uppercase text-white tracking-wider"
    value={displayHex}
    oninput={(e) => (hexDraft = (e.currentTarget as HTMLInputElement).value)}
    onblur={commitHex}
    onkeydown={(e) => {
      if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
      else if (e.key === "Escape") {
        hexDraft = null;
        (e.currentTarget as HTMLInputElement).blur();
      }
    }}
    spellcheck="false"
    autocomplete="off"
  />
  {#if alpha}
    <NumberInput
      class="w-14 shrink-0"
      value={Math.round(a * 100)}
      onChange={(p) => {
        a = Math.max(0, Math.min(1, p / 100));
        emit();
      }}
      onCommit={() => emit(true)}
      min={0}
      max={100}
      step={1}
      integer
      suffix="%"
    />
  {/if}
</div>
