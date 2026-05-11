<script lang="ts">
  import { EDGE_THICKNESS } from "./consts";
  import type { Edge, HandleProps } from "./types";

  interface Props extends HandleProps {
    edge: Edge;
  }

  const { edge, onPointerDown, halfSize }: Props = $props();

  const { x, y, width, height } = $derived.by(() => {
    if (edge.axis === "x") {
      return {
        x: edge.sign * halfSize.w - EDGE_THICKNESS / 2,
        y: -halfSize.h,
        width: EDGE_THICKNESS,
        height: halfSize.h * 2,
      };
    }

    return {
      x: -halfSize.w,
      y: edge.sign * halfSize.h - EDGE_THICKNESS / 2,
      width: halfSize.w * 2,
      height: EDGE_THICKNESS,
    };
  });
</script>

<rect
  {x}
  {y}
  {width}
  {height}
  role="button"
  tabindex="-1"
  aria-label="Resize"
  fill="transparent"
  style:cursor={edge.cursor}
  style:pointer-events="auto"
  onpointerdown={onPointerDown}
/>
