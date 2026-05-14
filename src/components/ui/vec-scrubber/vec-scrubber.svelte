<script lang="ts">
  import { cn } from "@/lib/utils";
  import { NumberInput } from "@/components/ui/number-input";

  type Vec2 = readonly [number, number];
  type Vec3 = readonly [number, number, number];
  type Vec4 = readonly [number, number, number, number];
  type Vec = Vec2 | Vec3 | Vec4;

  interface Props {
    /** Tuple length determines the number of axes rendered. */
    value: Vec;
    onChange: (value: Vec) => void;
    /**
     * Fires when an axis scrub commits (drag-end / Enter / arrow-key). Use to
     * gate expensive side effects to discrete commits while `onChange`
     * streams live updates for display.
     */
    onCommit?: (value: Vec) => void;
    /** Per-axis labels; defaults to X/Y/Z/W. */
    axes?: readonly string[];
    step?: number;
    /** Round committed values to integers. */
    integer?: boolean;
    class?: string;
  }

  let {
    value,
    onChange,
    onCommit,
    axes,
    step = 0.01,
    integer = false,
    class: className,
  }: Props = $props();

  const DEFAULT_AXES = ["X", "Y", "Z", "W"];

  let labels = $derived(axes ?? DEFAULT_AXES.slice(0, value.length));

  function setAxis(i: number, next: number, final: boolean) {
    const arr = value.slice() as number[];
    arr[i] = next;
    const out = arr as unknown as Vec;
    if (final) onCommit?.(out);
    else onChange(out);
  }
</script>

<div class={cn("flex items-center gap-1 min-w-0", className)}>
  {#each value as v, i (i)}
    <NumberInput
      class="flex-1 min-w-0"
      label={labels[i]}
      value={v}
      onChange={(n) => setAxis(i, n, false)}
      onCommit={(n) => setAxis(i, n, true)}
      {step}
      {integer}
    />
  {/each}
</div>
