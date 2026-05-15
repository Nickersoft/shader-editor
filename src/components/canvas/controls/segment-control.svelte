<script lang="ts">
  import type { AnySegmentControl } from "@/shaders/core";

  import DraggableHandle from "./draggable-handle.svelte";
  import { COLORS } from "./consts";
  import { getOverlayContext } from "./context";
  import { asSegment } from "./utils";

  interface Props {
    control: AnySegmentControl;
  }

  let { control }: Props = $props();

  const ctx = getOverlayContext();

  const render = $derived(asSegment(ctx, control));

  const from = $derived.by(() => {
    const [x, y] = render.from.read();
    return ctx.toPx({ x, y });
  });

  const to = $derived.by(() => {
    const [x, y] = render.to.read();
    return ctx.toPx({ x, y });
  });
</script>

<g>
  <line
    x1={from.x}
    y1={from.y}
    x2={to.x}
    y2={to.y}
    stroke={COLORS.segmentStroke}
    stroke-width={1.5}
    stroke-dasharray="4 3"
    style:pointer-events="none"
  />
  <DraggableHandle
    cx={from.x}
    cy={from.y}
    size={render.size}
    fill={render.fromFill}
    onDrag={(px, py) => {
      const uv = ctx.fromPx({ x: px, y: py });
      render.from.write([uv.x, uv.y]);
    }}
  />
  <DraggableHandle
    cx={to.x}
    cy={to.y}
    size={render.size}
    fill={render.toFill}
    onDrag={(px, py) => {
      const uv = ctx.fromPx({ x: px, y: py });
      render.to.write([uv.x, uv.y]);
    }}
  />
</g>
