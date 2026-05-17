<script lang="ts">
  import * as Field from "@/components/ui/field";
  import * as Select from "@/components/ui/select";
  import { composer } from "@/lib/state";
  import type { BlendMode, Shader } from "@/shaders";

  import { BLEND_MODES } from "../consts";
  import PanelSection from "../panel-section.svelte";

  interface Props {
    layerNode: Shader;
  }

  const { layerNode }: Props = $props();

  const blendModeLabels = Object.fromEntries(BLEND_MODES.map(({ label, value }) => [value, label]));
  const blendModeLabel = $derived(blendModeLabels[layerNode.blendMode] ?? "normal");
</script>

<PanelSection>
  <Field.Root>
    <Field.Label>Blending</Field.Label>
    <Field.Content>
      <Select.Root
        type="single"
        value={layerNode.blendMode || "normal"}
        onValueChange={(v) => composer.updateBlendMode(layerNode.id, v as BlendMode)}
      >
        <Select.Trigger>
          {blendModeLabel}
        </Select.Trigger>
        <Select.Content>
          {#each BLEND_MODES as mode (mode.value)}
            <Select.Item value={mode.value}>{mode.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </Field.Content>
  </Field.Root>
</PanelSection>
