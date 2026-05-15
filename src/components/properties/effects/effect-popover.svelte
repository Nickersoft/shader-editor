<script lang="ts">
  import * as Popover from "@/components/ui/popover";
  import { composer } from "@/lib/state/composer.svelte";
  import {
    inspectUiFields,
    type InspectedUiField,
  } from "@/lib/codegen/schema-introspection";
  import type { EffectNode } from "@/shaders/core/node.svelte";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import FieldControl from "../field-control.svelte";
  import GraphParameterPanel, {
    asGraphHost,
  } from "../graph-parameter-panel.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    effect: EffectNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Snippet receives the bits-ui trigger props bag — spread it onto your
    // own element. Lets the trigger be a <div> with nested buttons (toggle,
    // trash) without producing nested-<button> invalid HTML.
    trigger: Snippet<[{ props: Record<string, unknown> }]>;
  }

  let { effect, open, onOpenChange, trigger }: Props = $props();

  let cls = $derived(effect.cls);
  // Graph-based effects declare empty static `config`/`uniforms` schemas —
  // their user-facing knobs live as GroupInput pin defaults inside the
  // effect's internal node graph. Defer to `GraphParameterPanel` for those.
  let graphEffect = $derived(asGraphHost(effect));
  // For schema-based effects: `uniforms` first (the user-tweakable knobs);
  // `config` after (structural switches). Same precedence as the main panel.
  let uniformFields = $derived(inspectUiFields(cls.uniforms));
  let configFields = $derived(inspectUiFields(cls.config));

  function fieldLabel(field: InspectedUiField): string {
    return field.schema.description ?? field.key;
  }
</script>

<Popover.Root {open} {onOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      {@render trigger({ props })}
    {/snippet}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      side="left"
      align="start"
      sideOffset={12}
      class="w-70 max-h-[60vh] flex flex-col z-50 overflow-hidden outline-none"
    >
      <div
        class="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.1)] shrink-0"
      >
        <span
          class="size-3 rounded-[3px] shrink-0"
          style:background-color={effect.meta.color}
          aria-hidden="true"
        ></span>
        <p class="text-[13px] font-medium text-white truncate flex-1">
          {effect.meta.name}
        </p>
      </div>
      <ScrollArea class="flex-1 min-h-0">
        {#if graphEffect}
          <GraphParameterPanel field={graphEffect} />
        {:else}
          <div class="px-3 py-3 space-y-4">
            {#if uniformFields.length + configFields.length === 0}
              <p class="px-1 text-[12px] text-white/50">
                No tweakable parameters.
              </p>
            {:else}
              {#each uniformFields as field (field.key)}
                {@const value = effect.uniforms[field.key]}
                <FieldControl
                  {field}
                  label={fieldLabel(field)}
                  {value}
                  onChange={(v) =>
                    composer.updateUniform(effect.id, field.key, v)}
                />
              {/each}
              {#each configFields as field (field.key)}
                {@const value = effect.config[field.key]}
                <FieldControl
                  {field}
                  label={fieldLabel(field)}
                  {value}
                  onChange={(v) => composer.updateConfig(effect.id, field.key, v)}
                />
              {/each}
            {/if}
          </div>
        {/if}
      </ScrollArea>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
