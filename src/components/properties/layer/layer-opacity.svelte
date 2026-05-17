<script lang="ts">
  import { NumberInput } from "@/components/ui/number-input";
  import { composer } from "@/lib/state";
  import type { Shader } from "@/shaders";

  import PanelSection from "../panel-section.svelte";

  interface Props {
    layerNode: Shader;
  }

  const { layerNode }: Props = $props();
</script>

<PanelSection>
  <NumberInput
    label="Opacity"
    value={Math.round(layerNode.opacity * 100)}
    onChange={(v) => composer.updateOpacity(layerNode.id, v / 100)}
    min={0}
    max={100}
    step={1}
    integer
    suffix="%"
  />
</PanelSection>
