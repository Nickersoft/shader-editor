<script lang="ts">
  import type { Layer } from "@/shaders/core/scene.svelte";
  import LayerEffects from "./layer-effects.svelte";
  import LayerDistortions from "./layer-distortions.svelte";
  import LayerAdjustments from "./layer-adjustments.svelte";

  interface Props {
    layer: Layer;
  }

  let { layer }: Props = $props();
</script>

<LayerEffects {layer} />
<LayerDistortions {layer} />
<LayerAdjustments {layer} />
