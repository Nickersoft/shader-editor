<script lang="ts">
  import * as Select from "@/components/ui/select";
  import { composer } from "@/lib/state";
  import { BlendMode } from "@/shaders";

  import * as Inputs from "../inputs";
  import Panel from "../panel.svelte";
  import LayerBlending from "./layer-blending.svelte";
  import LayerOpacity from "./layer-opacity.svelte";

  interface Props {
    layerNode: Node<Record<string, unknown>, Record<string, unknown>>;
    // node:

    //      {@const meta = selectedNode.meta}
    //      {@const allFieldsCount =
    //        (fields?.uniformFields.length ?? 0) + (fields?.configFields.length ?? 0)}
  }

  const { layerNode }: Props = $props();
</script>

<Panel title={layerNode.meta.name}>
  <LayerBlending {layerNode} />
  <LayerOpacity {layerNode} /> 

    {#if selectedGraphHost}
      <GraphParameterPanel field={selectedGraphHost} />
    {/if}

    {#if allFieldsCount > 0}
      {#each groupedFields as section (section.key)}
        <section
          class="space-y-4 border-b border-[rgba(255,255,255,0.1)] px-3 py-3 last:border-b-0"
        >
          <div class="px-1">
            <p class="text-[14px] font-medium text-white">
              {section.label}
            </p>
          </div>
          {#each section.entries as entry (entryKey(entry))}
            {#if Array.isArray(entry)}
              <div
                class="grid gap-1.5"
                style:grid-template-columns="repeat({entry.length}, minmax(0,1fr))"
              >
                {#each entry as field (field.key)}
                  <NodeFieldRow
                    node={selectedNode}
                    {field}
                    label={rowLabel(field)}
                  />
                {/each}
              </div>
            {:else}
              <NodeFieldRow
                node={selectedNode}
                field={entry}
                label={fieldLabel(entry)}
              />
            {/if}
          {/each}
        </section>
      {/each}
      {#if configEntries.length > 0}
        <section
          class="space-y-4 border-b border-[rgba(255,255,255,0.1)] px-3 py-3 last:border-b-0"
        >
          <div class="px-1">
            <p class="text-[14px] font-medium text-white">Configuration</p>
          </div>
          {#each configEntries as entry (entryKey(entry))}
            {#if Array.isArray(entry)}
              <div
                class="grid gap-1.5"
                style:grid-template-columns="repeat({entry.length}, minmax(0,1fr))"
              >
                {#each entry as field (field.key)}
                  <NodeFieldRow node={selectedNode} {field} label={rowLabel(field)} />
                {/each}
              </div>
            {:else}
              <NodeFieldRow
                node={selectedNode}
                field={entry}
                label={fieldLabel(entry)}
              />
            {/if}
          {/each}
        </section>
      {/if}
    {/if}

    {#if selectedIsLayerSource && selectedLayer}
      <LayerEffectsSections layer={selectedLayer} />
    {/if}
  </div>
</Panel>
