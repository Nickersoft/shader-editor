<script lang="ts">
  import type { AnyPointControl } from "@/shaders/core";

  import DraggableHandle from "./draggable-handle.svelte";

  import { getOverlayContext } from "./context";
  import { asPoint } from "./utils";

  interface Props {
    control: AnyPointControl;
  }

  let { control }: Props = $props();

  const ctx = getOverlayContext();

  const render = $derived(asPoint(ctx, control));

  const pos = $derived.by(() => {
    const [x, y] = render.handle.read();
    return ctx.toPx({ x, y });
  });
</script>

<DraggableHandle
  cx={pos.x}
  cy={pos.y}
  size={render.size}
  fill={render.fill}
  onDrag={(px, py) => {
    const uv = ctx.fromPx({ x: px, y: py });
    render.handle.write([uv.x, uv.y]);
  }}
/>
