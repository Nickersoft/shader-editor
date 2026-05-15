<script lang="ts">
  import { composer } from "@/lib/state/composer.svelte";
  import {
    inspectUiFields,
    type InspectedField,
    type InspectedUiField,
  } from "@/lib/codegen/schema-introspection";
  import { getMetaDeep } from "@/shaders/core/schemas";
  import {
    EffectNode,
    GeneratorNode,
    getEffectScope,
  } from "@/shaders/core/node.svelte";
  import type { BlendMode } from "@/shaders/core/types";
  import { NumberInput } from "@/components/ui/number-input";
  import { Label } from "@/components/ui/label";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import * as Select from "@/components/ui/select";
  import { LayerEffectsSections } from "./layer";
  import SceneEffectsSections from "./scene/scene-effects.svelte";
  import * as Inputs from "./inputs";
  import NodeFieldRow from "./node-field-row.svelte";
  import GraphParameterPanel, {
    asGraphHost,
  } from "./graph-parameter-panel.svelte";
  import * as Card from "@/components/ui/card";
  import { SceneProperties } from "./scene";

  let selectedNode = $derived.by(() => {
    if (!composer.selectedNodeId) return null;
    return composer.scene.findNode(composer.selectedNodeId)?.node ?? null;
  });
  let selectedGraphHost = $derived(asGraphHost(selectedNode));

  // The owning layer of the current selection — used to surface that layer's
  // Effects/Distortions/Adjustments sections at the bottom of the panel when
  // the layer's source is the selected node. When an effect is selected we
  // only show its own properties; clicking back to the layer row brings the
  // effect lists back into view.
  let selectedLayer = $derived.by(() => {
    if (!composer.selectedNodeId) return null;
    return composer.scene.findNode(composer.selectedNodeId)?.layer ?? null;
  });
  let selectedIsLayerSource = $derived(
    selectedLayer && selectedNode && selectedNode === selectedLayer.source,
  );

  let selectionScope = $derived.by(() => {
    if (!selectedNode) return "";
    if (selectedNode instanceof GeneratorNode) return "Layer";
    if (selectedNode instanceof EffectNode) {
      return getEffectScope(selectedNode.cls) === "scene"
        ? "Scene Effect"
        : "Effect Layer";
    }
    return "";
  });

  let fields = $derived.by(() => {
    if (!selectedNode) return null;
    const cls = selectedNode.cls;
    return {
      // `uniforms` schema → user-tweakable knobs (numerics, colors, samplers,
      // transform). Renders under Transform / Properties.
      uniformFields: inspectUiFields(cls.uniforms),
      // `config` schema → editor-level structural switches (EdgeMode, halftone
      // style, etc.) that branch the emitted GLSL. Renders under Configuration.
      configFields: inspectUiFields(cls.config),
    };
  });

  // Split uniforms into Transform / Properties sections. Transform always
  // renders first when present so position/size/rotation sit at the top of
  // every shape's panel.
  type FieldEntry = InspectedUiField | InspectedUiField[];

  // Bucket consecutive (or same-row-keyed) fields into horizontal rows. Fields
  // with no `row` meta render solo; matching `row` keys merge into one array
  // that the template renders as a grid row.
  function pairUp(fields: InspectedUiField[]): FieldEntry[] {
    const out: FieldEntry[] = [];
    const rows = new Map<string, InspectedUiField[]>();
    for (const f of fields) {
      const row = getMetaDeep(f.schema)?.ui?.row;
      if (row) {
        let bucket = rows.get(row);
        if (!bucket) {
          bucket = [];
          rows.set(row, bucket);
          out.push(bucket);
        }
        bucket.push(f);
      } else {
        out.push(f);
      }
    }
    return out;
  }

  let groupedFields = $derived.by(() => {
    const transform: InspectedUiField[] = [];
    const other: InspectedUiField[] = [];
    const uniformFields = fields?.uniformFields ?? [];
    for (const f of uniformFields) {
      if (getMetaDeep(f.schema)?.ui?.group === "transform") transform.push(f);
      else other.push(f);
    }
    return [
      {
        key: "transform",
        label: "Transform",
        entries: pairUp(transform),
      },
      { key: "properties", label: "Properties", entries: pairUp(other) },
    ].filter((s) => s.entries.length > 0);
  });

  let configEntries = $derived(pairUp(fields?.configFields ?? []));

  function fieldLabel(field: InspectedField | InspectedUiField): string {
    return field.schema.description ?? field.key;
  }

  function rowLabel(field: InspectedUiField): string {
    return getMetaDeep(field.schema)?.ui?.shortLabel ?? fieldLabel(field);
  }

  function entryKey(entry: FieldEntry): string {
    return Array.isArray(entry)
      ? `row:${entry.map((f) => f.key).join("/")}`
      : entry.key;
  }

  let blendModeLabel = $derived(
    BLEND_MODES.find((m) => m.value === (selectedNode?.blendMode ?? "normal"))
      ?.label ?? "Normal",
  );
</script>

{#snippet header(name: string, label: string)}
  <Card.Header class="flex items-start border-b">
    <div class="flex flex-col gap-1 min-w-0">
      <p class="text-sm font-medium text-foreground truncate">Scene</p>
      <p class="text-xs text-muted-foreground">Root</p>
    </div>
  </Card.Header>
{/snippet}

{#if composer.isSceneSelected}
  <SceneProperties />
{/if}

<!-- <Card.Root class="h-full overflow-hidden min-h-0 pointer-events-auto">
  {#if composer.isSceneSelected}
    <div class="flex flex-col h-full min-h-0">
      {@render header("Scene", "Root")}

      <ScrollArea class="flex-1 min-h-0">
        <div class="py-3">
          <section
            class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)]"
          >
            <div class="px-1">
              <p class="text-[12px] font-medium text-white">Background</p>
            </div>
            <Inputs.Color
              value={composer.scene.background.color}
              onChange={(v) =>
                composer.updateSceneBackground([
                  v[0] ?? 0,
                  v[1] ?? 0,
                  v[2] ?? 0,
                  v[3] ?? 1,
                ])}
            />
          </section>

          <SceneEffectsSections />
        </div>
      </ScrollArea>
    </div>
  {:else if !selectedNode || !fields}
    <div
      class="flex items-center justify-center h-full text-white/50 text-sm px-6 text-center"
    >
      Select a layer to edit its properties.
    </div>
  {:else}
    {@const meta = selectedNode.meta}
    {@const allFieldsCount =
      (fields?.uniformFields.length ?? 0) + (fields?.configFields.length ?? 0)}
    <div class="flex flex-col h-full min-h-0">
      <Card.Header class="border-b">
        <span
          class="size-4 rounded-[4px] mt-0.5 shrink-0"
          style:background-color={meta.color}
          aria-hidden="true"
        ></span>
        <div class="flex flex-col gap-1 min-w-0">
          <p class="text-[14px] font-medium text-white truncate">
            {meta.name}
          </p>
          {#if selectionScope}
            <p class="text-[12px] font-medium text-white/50">
              {selectionScope}
            </p>
          {/if}
        </div>
      </Card.Header>

      <Card.Content>
        <ScrollArea class="flex-1 min-h-0">
          <div class="py-3">
            <section
              class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)]"
            >
              <div class="px-1">
                <p class="text-[12px] font-medium text-white">Blending</p>
              </div>
              <Select.Root
                type="single"
                value={selectedNode.blendMode || "normal"}
                onValueChange={(v) =>
                  composer.updateBlendMode(selectedNode!.id, v as BlendMode)}
              >
                <Select.Trigger
                  class="w-full h-9 text-[14px] bg-[var(--surface-strong)] border-0 text-white"
                >
                  {blendModeLabel}
                </Select.Trigger>
                <Select.Content>
                  {#each BLEND_MODES as mode (mode.value)}
                    <Select.Item value={mode.value}>{mode.label}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </section>

            <section class="px-3 py-3 border-b border-[rgba(255,255,255,0.1)]">
              <NumberInput
                label="Opacity"
                value={Math.round(selectedNode.opacity * 100)}
                onChange={(v) =>
                  composer.updateOpacity(selectedNode!.id, v / 100)}
                min={0}
                max={100}
                step={1}
                integer
                suffix="%"
              />
            </section>

            {#if selectedGraphHost}
              <GraphParameterPanel field={selectedGraphHost} />
            {/if}

            {#if allFieldsCount > 0}
              {#each groupedFields as section (section.key)}
                <section
                  class="px-3 py-3 space-y-4 border-b border-[rgba(255,255,255,0.1)] last:border-b-0"
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
                        style:grid-template-columns="repeat({entry.length},
                        minmax(0,1fr))"
                      >
                        {#each entry as field (field.key)}
                          <NodeFieldRow
                            node={selectedNode}
                            {field}
                            kind="uniform"
                            label={rowLabel(field)}
                          />
                        {/each}
                      </div>
                    {:else}
                      <NodeFieldRow
                        node={selectedNode}
                        field={entry}
                        kind="uniform"
                        label={fieldLabel(entry)}
                      />
                    {/if}
                  {/each}
                </section>
              {/each}
              {#if configEntries.length > 0}
                <section
                  class="px-3 py-3 space-y-4 border-b border-[rgba(255,255,255,0.1)] last:border-b-0"
                >
                  <div class="px-1">
                    <p class="text-[14px] font-medium text-white">
                      Configuration
                    </p>
                  </div>
                  {#each configEntries as entry (entryKey(entry))}
                    {#if Array.isArray(entry)}
                      <div
                        class="grid gap-1.5"
                        style:grid-template-columns="repeat({entry.length},
                        minmax(0,1fr))"
                      >
                        {#each entry as field (field.key)}
                          <NodeFieldRow
                            node={selectedNode}
                            {field}
                            kind="config"
                            label={rowLabel(field)}
                          />
                        {/each}
                      </div>
                    {:else}
                      <NodeFieldRow
                        node={selectedNode}
                        field={entry}
                        kind="config"
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
        </ScrollArea>
      </Card.Content>
    </div>
  {/if}
</Card.Root> -->
