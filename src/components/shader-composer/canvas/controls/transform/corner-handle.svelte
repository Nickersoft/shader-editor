<script lang="ts">
  import { HANDLE_SIZE } from "./consts";
  import type { Corner, HandleProps } from "./types";

  interface Props extends HandleProps {
    corner: Corner;
  }

  const { corner, halfSize, onPointerDown }: Props = $props();
</script>

<rect
  role="button"
  tabindex="-1"
  aria-label="Resize corner"
  x={corner.sx * halfSize.w - HANDLE_SIZE / 2}
  y={corner.sy * halfSize.h - HANDLE_SIZE / 2}
  width={HANDLE_SIZE}
  height={HANDLE_SIZE}
  fill="#22d3ee"
  stroke="#0a0a0a"
  stroke-width="1.5"
  vector-effect="non-scaling-stroke"
  style:cursor={corner.cursor}
  style:pointer-events="auto"
  onpointerdown={onPointerDown}
/>
