<script lang="ts">
  import type { AnyRadiusControl } from "@/shaders/core/spatial";

  import DraggableHandle from "./draggable-handle.svelte";

  import { COLORS } from "./consts";
  import { getOverlayContext } from "./context";
  import { asRadius } from "./utils";

  interface Props {
    control: AnyRadiusControl;
  }

  let { control }: Props = $props();

  const ctx = getOverlayContext();

  let render = $derived(asRadius(ctx, control));

  let center = $derived.by(() => {
    const [x, y] = render.center.read();
    return ctx.toPx({ x, y });
  });

  let r = $derived(
    ctx.radiusToPx((ctx.config[render.rKey] as number) ?? render.rDefault),
  );
</script>

<g>
  <circle
    cx={center.x}
    cy={center.y}
    {r}
    fill="none"
    stroke={COLORS.guideStroke}
    stroke-width={1}
    stroke-dasharray="3 3"
    style:pointer-events="none"
  />
  {#if render.centerFill}
    <DraggableHandle
      cx={center.x}
      cy={center.y}
      fill={render.centerFill}
      onDrag={(px, py) => {
        const uv = ctx.fromPx({ x: px, y: py });
        render.center.write([uv.x, uv.y]);
      }}
    />
  {/if}
  <DraggableHandle
    cx={center.x + r}
    cy={center.y}
    fill={COLORS.secondary}
    cursor="ew-resize"
    onDrag={(px, py) => {
      const dx = px - center.x;
      const dy = py - center.y;
      ctx.setField(render.rKey, ctx.radiusFromPx(Math.hypot(dx, dy)));
    }}
  />
</g>
