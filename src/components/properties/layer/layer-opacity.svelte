<script lang="ts">
  import { NumberInput } from "@/components/ui/number-input";
  import { composer } from "@/lib/state";
  import type { Shader } from "@/shaders";

  import PanelSection from "../panel-section.svelte";

  interface Props {
    node: Shader;
  }

  const { node }: Props = $props();
</script>

<PanelSection>
  <NumberInput
    label="Opacity"
    value={Math.round(node.opacity * 100)}
    onChange={(v) => composer.updateOpacity(node.id, v / 100)}
    min={0}
    max={100}
    step={1}
    integer
    suffix="%"
  />
</PanelSection>
