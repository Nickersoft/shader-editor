<script lang="ts">
  import {
    isPointControl,
    isRadiusControl,
    isSegmentControl,
    type SpatialControl,
  } from "@/shaders";
  import {
    PointControl,
    RadiusControl,
    SegmentControl,
    BoundingBoxControl,
    PolygonControl,
    TransformControl,
  } from "./controls";

  interface Props {
    control: SpatialControl;
  }

  const { control: c }: Props = $props();
</script>

{#if isPointControl(c)}
  <PointControl control={c} />
{:else if isRadiusControl(c)}
  <RadiusControl control={c} />
{:else if isSegmentControl(c)}
  <SegmentControl control={c} />
{:else if c.kind === "transform"}
  <TransformControl control={c} />
{:else if c.kind === "boundingBox"}
  <BoundingBoxControl control={c} />
{:else if c.kind === "polygon"}
  <PolygonControl control={c} />
{/if}
