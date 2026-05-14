<script lang="ts">
  import { cn } from "@/lib/utils";
  import { NumberInput } from "@/components/ui/number-input";

  type Vec3 = readonly [number, number, number];
  type Vec4 = readonly [number, number, number, number];
  type Vec = Vec3 | Vec4;

  interface Props {
    /** [r, g, b] or [r, g, b, a] — channels in 0..1 linear space. */
    value: Vec;
    onChange: (value: Vec) => void;
    /**
     * Fires on commit only: the colour picker closes, or the alpha scrubber
     * finishes a drag. `onChange` streams interim values for live display.
     */
    onCommit?: (value: Vec) => void;
    /** When true, the value is treated as vec4 and an alpha scrubber appears. */
    alpha?: boolean;
    class?: string;
  }

  let { value, onChange, onCommit, alpha = false, class: className }: Props = $props();

  let inputEl = $state<HTMLInputElement | null>(null);

  // 0..1 → #RRGGBB for the native colour picker. Round-trips losslessly for
  // pure on-screen colours; HDR colour values above 1.0 clip in the swatch
  // but are preserved in `value` until the next picker commit.
  let hex = $derived(rgbToHex(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0));

  function rgbToHex(r: number, g: number, b: number): string {
    const c = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n * 255)))
        .toString(16)
        .padStart(2, "0");
    return `#${c(r)}${c(g)}${c(b)}`;
  }

  function hexToRgb(h: string): [number, number, number] {
    const cleaned = h.trim().replace(/^#/, "");
    if (!/^[0-9a-f]{6}$/i.test(cleaned)) {
      return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
    }
    const n = parseInt(cleaned, 16);
    return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
  }

  function colorVec(next: string): Vec {
    const [r, g, b] = hexToRgb(next);
    return (alpha ? [r, g, b, value[3] ?? 1] : [r, g, b]) as Vec;
  }

  function alphaVec(a: number): Vec {
    return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0, a] as Vec;
  }
</script>

<div class={cn("flex items-center gap-1 min-w-0", className)}>
  <button
    type="button"
    class="h-7 flex-1 min-w-0 rounded-md ring-1 ring-inset ring-white/10 hover:ring-white/30 transition-shadow cursor-pointer"
    style:background-color={hex}
    aria-label="Pick colour"
    onclick={() => inputEl?.click()}
  ></button>
  <input
    bind:this={inputEl}
    type="color"
    class="sr-only"
    value={hex}
    oninput={(e) => onChange(colorVec((e.currentTarget as HTMLInputElement).value))}
    onchange={(e) => onCommit?.(colorVec((e.currentTarget as HTMLInputElement).value))}
  />
  {#if alpha}
    <NumberInput
      class="w-14 shrink-0"
      label="A"
      value={value[3] ?? 1}
      onChange={(a) => onChange(alphaVec(a))}
      onCommit={(a) => onCommit?.(alphaVec(a))}
      step={0.01}
      min={0}
      max={1}
    />
  {/if}
</div>
