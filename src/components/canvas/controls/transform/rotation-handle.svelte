<script lang="ts">
  import { ROTATE_HOT_RADIUS } from "./consts";
  import type { Corner, HandleProps } from "./types";

  interface Props extends HandleProps {
    corner: Corner;
  }

  const { onPointerDown, corner, halfSize }: Props = $props();

  const cx = $derived(corner.sx * (halfSize.w + ROTATE_HOT_RADIUS / 2));
  const cy = $derived(corner.sy * (halfSize.h + ROTATE_HOT_RADIUS / 2));

  function rotateCursor(): string {
    // Inline SVG cursor — a circular arrow. Browsers fall back to `grab`
    // when the data: URL isn't supported.
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12a9 9 0 1 1-3.7-7.3' /><polyline points='21 3 21 9 15 9'/></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 12 12, grab`;
  }
  const ROTATE_CURSOR = rotateCursor();
</script>

<rect
  role="button"
  tabindex="-1"
  aria-label="Rotate"
  x={cx - ROTATE_HOT_RADIUS / 2}
  y={cy - ROTATE_HOT_RADIUS / 2}
  width={ROTATE_HOT_RADIUS}
  height={ROTATE_HOT_RADIUS}
  fill="transparent"
  style:cursor={ROTATE_CURSOR}
  style:pointer-events="auto"
  onpointerdown={onPointerDown}
/>
