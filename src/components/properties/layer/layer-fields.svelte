<script lang="ts">
  import {
    inspectFields,
    type InspectedField,
  } from "@/lib/codegen/schema-introspection";
  import type { StaticEffect, StaticShader } from "@/shaders/core/shader.svelte";

  import NodeFieldRow from "../node-field-row.svelte";
  import PanelSection from "../panel-section.svelte";

  interface Props {
    node: StaticShader | StaticEffect;
  }

  let { node }: Props = $props();

  // Two buckets:
  //   - configFields: structural enum-string dropdowns (changing one triggers
  //     a shader recompile) — rendered under "Configuration".
  //   - uniformFields: live uniform knobs — split again below into
  //     Transform / Properties for layout purposes.
  let fields = $derived.by(() => {
    const uniformFields: InspectedField[] = [];
    const configFields: InspectedField[] = [];
    for (const f of inspectFields(node.cls.schema)) {
      (f.glslType === "enumString" ? configFields : uniformFields).push(f);
    }
    return { uniformFields, configFields };
  });

  type FieldEntry = InspectedField | InspectedField[];

  // Fields sharing a `ui.row` meta key collapse into a single grid row in the
  // template (e.g. an X/Y pair). Solo fields render one-per-row.
  function pairUp(fields: InspectedField[]): FieldEntry[] {
    const out: FieldEntry[] = [];
    const rows = new Map<string, InspectedField[]>();
    for (const f of fields) {
      const row = f.meta?.ui?.row;
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
    const transform: InspectedField[] = [];
    const other: InspectedField[] = [];
    for (const f of fields.uniformFields) {
      if (f.meta?.ui?.group === "transform") transform.push(f);
      else other.push(f);
    }
    return [
      { key: "transform", label: "Transform", entries: pairUp(transform) },
      { key: "properties", label: "Properties", entries: pairUp(other) },
    ].filter((s) => s.entries.length > 0);
  });

  let configEntries = $derived(pairUp(fields.configFields));

  function fieldLabel(field: InspectedField): string {
    return field.schema.description ?? field.key;
  }

  function rowLabel(field: InspectedField): string {
    return field.meta?.ui?.shortLabel ?? fieldLabel(field);
  }

  function entryKey(entry: FieldEntry): string {
    return Array.isArray(entry)
      ? `row:${entry.map((f) => f.key).join("/")}`
      : entry.key;
  }
</script>

{#each groupedFields as section (section.key)}
  <PanelSection class="space-y-4">
    <div class="px-1">
      <p class="text-[14px] font-medium text-white">{section.label}</p>
    </div>
    {#each section.entries as entry (entryKey(entry))}
      {#if Array.isArray(entry)}
        <div
          class="grid gap-1.5"
          style:grid-template-columns="repeat({entry.length}, minmax(0,1fr))"
        >
          {#each entry as field (field.key)}
            <NodeFieldRow {node} {field} label={rowLabel(field)} />
          {/each}
        </div>
      {:else}
        <NodeFieldRow {node} field={entry} label={fieldLabel(entry)} />
      {/if}
    {/each}
  </PanelSection>
{/each}

{#if configEntries.length > 0}
  <PanelSection class="space-y-4">
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
            <NodeFieldRow {node} {field} label={rowLabel(field)} />
          {/each}
        </div>
      {:else}
        <NodeFieldRow {node} field={entry} label={fieldLabel(entry)} />
      {/if}
    {/each}
  </PanelSection>
{/if}
