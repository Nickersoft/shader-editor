<script lang="ts">
  import type { PolygonControl } from "@/shaders/core";

  import DraggableHandle from "./draggable-handle.svelte";
  import { COLORS } from "./consts";
  import { getOverlayContext } from "./context";

  interface Props {
    control: PolygonControl;
  }

  let { control }: Props = $props();

  const ctx = getOverlayContext();
</script>

<g>
  {#each control.points as [xKey, yKey] (xKey + ":" + yKey)}
    {@const pos = ctx.toPx({
      x: (ctx.read(xKey) as number) ?? 0.5,
      y: (ctx.read(yKey) as number) ?? 0.5,
    })}
    <DraggableHandle
      cx={pos.x}
      cy={pos.y}
      fill={COLORS.primary}
      onDrag={(nx, ny) => {
        const uv = ctx.fromPx({ x: nx, y: ny });
        ctx.setFields({ [xKey]: uv.x, [yKey]: uv.y });
      }}
    />
  {/each}
</g>
