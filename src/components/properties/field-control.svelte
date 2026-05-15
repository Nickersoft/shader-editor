<script lang="ts">
  import { NumberInput } from "@/components/ui/number-input";
  import { Label } from "@/components/ui/label";
  import * as Select from "@/components/ui/select";
  import type {
    InspectedField,
    InspectedUiField,
  } from "@/lib/codegen/schema-introspection";
  import { getMetaDeep, type ImageInputValue } from "@/shaders/core/schemas";
  import * as Inputs from "./inputs";

  interface PaletteValue {
    values: number[][];
    length: number;
  }

  interface Props {
    field: InspectedField | InspectedUiField;
    label: string;
    value: unknown;
    onChange: (value: unknown) => void;
  }

  let { field, label, value, onChange }: Props = $props();

  let meta = $derived(getMetaDeep(field.schema));
  let ui = $derived(meta?.ui);

  const AXIS_LABELS = ["X", "Y", "Z", "W"];
</script>

{#if field.glslType === "enumString"}
  {@const opts = (field as InspectedUiField).enumValues ?? []}
  {@const labels = (field as InspectedUiField).enumLabels}
  {@const current = (value as string | undefined) ?? opts[0] ?? ""}
  {@const labelFor = (opt: string) =>
    labels?.[opt] ?? opt.charAt(0).toUpperCase() + opt.slice(1)}
  <div class="space-y-2">
    <Label class="text-xs text-muted-foreground">{label}</Label>
    <Select.Root
      type="single"
      value={current}
      onValueChange={(v) => onChange(v)}
    >
      <Select.Trigger class="w-full h-8 text-xs">
        {labelFor(current)}
      </Select.Trigger>
      <Select.Content>
        {#each opts as opt (opt)}
          <Select.Item value={opt}>
            {labelFor(opt)}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
{:else if field.glslType === "float"}
  {@const numValue = (value as number) ?? 0}
  <NumberInput
    {label}
    value={numValue}
    onChange={(v) => onChange(v)}
    min={ui?.min ?? 0}
    max={ui?.max ?? 1}
    step={ui?.step ?? 0.01}
  />
{:else if field.glslType === "int"}
  {@const intValue = (value as number) ?? 0}
  <NumberInput
    {label}
    value={intValue}
    onChange={(v) => onChange(v)}
    min={ui?.min ?? 0}
    max={ui?.max ?? 10}
    step={1}
    integer
  />
{:else if field.glslType === "bool"}
  <div class="flex items-center justify-between">
    <Label class="text-xs text-muted-foreground">{label}</Label>
    <input
      type="checkbox"
      checked={Boolean(value)}
      onchange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)}
    />
  </div>
{:else if field.glslType === "vec2"}
  {@const vec2Value = (value as number[]) ?? [0, 0]}
  <div class="space-y-1.5">
    <Label class="text-xs text-muted-foreground">{label}</Label>
    <div class="grid grid-cols-2 gap-1.5">
      <NumberInput
        label="X"
        value={vec2Value[0]}
        onChange={(v) => onChange([v, vec2Value[1]])}
        min={ui?.min ?? 0}
        max={ui?.max ?? 1}
        step={ui?.step ?? 0.01}
      />
      <NumberInput
        label="Y"
        value={vec2Value[1]}
        onChange={(v) => onChange([vec2Value[0], v])}
        min={ui?.min ?? 0}
        max={ui?.max ?? 1}
        step={ui?.step ?? 0.01}
      />
    </div>
  </div>
{:else if field.glslType === "vec3" || field.glslType === "vec4"}
  {@const vecValue = (value as number[]) ?? []}
  {@const isColor = ui?.color || vecValue.every((v) => v >= 0 && v <= 1)}
  {#if isColor}
    <div class="space-y-2">
      <Label class="text-xs text-muted-foreground">{label}</Label>
      <Inputs.Color
        value={vecValue}
        onChange={(next) => onChange(next as unknown)}
      />
    </div>
  {:else}
    <div class="space-y-1.5">
      <Label class="text-xs text-muted-foreground">{label}</Label>
      <div
        class="grid {field.glslType === 'vec3'
          ? 'grid-cols-3'
          : 'grid-cols-4'} gap-1.5"
      >
        {#each vecValue as v, i (i)}
          <NumberInput
            label={AXIS_LABELS[i]}
            value={v}
            onChange={(nv) => {
              const next = [...vecValue];
              next[i] = nv;
              onChange(next);
            }}
            min={ui?.min ?? 0}
            max={ui?.max ?? 1}
            step={ui?.step ?? 0.01}
          />
        {/each}
      </div>
    </div>
  {/if}
{:else if field.glslType === "sampler2D"}
  {@const imgValue = value as ImageInputValue | undefined}
  <div class="space-y-2">
    <Label class="text-xs text-muted-foreground">{label}</Label>
    <Inputs.Image
      value={imgValue ?? {
        url: null,
        sourceKind: "url",
        fit: "cover",
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
      }}
      onChange={(next) => onChange(next as unknown)}
    />
  </div>
{:else if field.glslType === "vec4Array"}
  {@const arr = value as PaletteValue | undefined}
  {@const max = ui?.array?.maxLength ?? field.arrayLength ?? 10}
  {@const min = ui?.array?.minLength ?? 1}
  <div class="space-y-2">
    <Label class="text-xs text-muted-foreground">{label}</Label>
    <Inputs.ColorArray
      value={arr ?? { values: [[1, 1, 1, 1]], length: 1 }}
      maxLength={max}
      minLength={min}
      onChange={(next) => onChange(next as unknown)}
    />
  </div>
{/if}
