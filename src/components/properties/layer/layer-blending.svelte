<script lang="ts">
  import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
  import * as Select from "@/components/ui/select";
  import { composer } from "@/lib/state";
  import type { BlendMode, Shader } from "@/shaders";

  import { BLEND_MODES } from "../consts";
  import PanelSection from "../panel-section.svelte";

  interface Props {
    node: Shader;
  }

  const { node }: Props = $props();

  const blendModeLabels = Object.fromEntries(BLEND_MODES.map(({ label, value }) => [value, label]));
  const blendModeLabel = $derived(blendModeLabels[node.blendMode] ?? "normal");
</script>

<PanelSection>
  <Field>
    <FieldLabel>Blending</FieldLabel>
    <FieldContent>
      <Select.Root
        type="single"
        value={node.blendMode || "normal"}
        onValueChange={(v) => composer.updateBlendMode(node.id, v as BlendMode)}
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
    </FieldContent>
  </Field>
</PanelSection>
