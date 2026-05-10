<script lang="ts">
	import { Slider } from '@/components/ui/slider';
	import { Label } from '@/components/ui/label';
	import * as Select from '@/components/ui/select';
	import type {
		InspectedField,
		InspectedUiField
	} from '@/lib/codegen/schema-introspection';
	import { getMetaDeep, type ImageInputValue } from '@/shaders/core/schemas';
	import ColorInput from './color-input.svelte';
	import ColorArrayInput from './color-array-input.svelte';
	import ImageInputComp from './image-input.svelte';

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
</script>

{#if field.glslType === 'enumString'}
	{@const opts = (field as InspectedUiField).enumValues ?? []}
	{@const current = (value as string | undefined) ?? opts[0] ?? ''}
	<div class="space-y-2">
		<Label class="text-xs text-muted-foreground">{label}</Label>
		<Select.Root type="single" value={current} onValueChange={(v) => onChange(v)}>
			<Select.Trigger class="w-full h-8 text-xs">
				{current.charAt(0).toUpperCase() + current.slice(1)}
			</Select.Trigger>
			<Select.Content>
				{#each opts as opt (opt)}
					<Select.Item value={opt}>
						{opt.charAt(0).toUpperCase() + opt.slice(1)}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
{:else if field.glslType === 'float'}
	{@const numValue = (value as number) ?? 0}
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<Label class="text-xs text-muted-foreground">{label}</Label>
			<span class="text-xs text-muted-foreground font-mono w-12 text-right">
				{numValue.toFixed(2)}
			</span>
		</div>
		<Slider
			type="single"
			value={numValue}
			onValueChange={(v) => onChange(v as number)}
			min={ui?.min ?? 0}
			max={ui?.max ?? 1}
			step={ui?.step ?? 0.01}
			class="w-full"
		/>
	</div>
{:else if field.glslType === 'int'}
	{@const intValue = (value as number) ?? 0}
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<Label class="text-xs text-muted-foreground">{label}</Label>
			<span class="text-xs text-muted-foreground font-mono w-12 text-right">
				{intValue}
			</span>
		</div>
		<Slider
			type="single"
			value={intValue}
			onValueChange={(v) => onChange(Math.round(v as number))}
			min={ui?.min ?? 0}
			max={ui?.max ?? 10}
			step={1}
			class="w-full"
		/>
	</div>
{:else if field.glslType === 'bool'}
	<div class="flex items-center justify-between">
		<Label class="text-xs text-muted-foreground">{label}</Label>
		<input
			type="checkbox"
			checked={Boolean(value)}
			onchange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)}
		/>
	</div>
{:else if field.glslType === 'vec2'}
	{@const vec2Value = (value as number[]) ?? [0, 0]}
	<div class="space-y-3">
		<Label class="text-xs text-muted-foreground">{label}</Label>
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<span class="text-xs text-muted-foreground w-4">X</span>
				<Slider
					type="single"
					value={vec2Value[0]}
					onValueChange={(v) => onChange([v as number, vec2Value[1]])}
					min={ui?.min ?? 0}
					max={ui?.max ?? 1}
					step={ui?.step ?? 0.01}
					class="flex-1"
				/>
				<span class="text-xs text-muted-foreground font-mono w-10 text-right">
					{vec2Value[0].toFixed(2)}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-xs text-muted-foreground w-4">Y</span>
				<Slider
					type="single"
					value={vec2Value[1]}
					onValueChange={(v) => onChange([vec2Value[0], v as number])}
					min={ui?.min ?? 0}
					max={ui?.max ?? 1}
					step={ui?.step ?? 0.01}
					class="flex-1"
				/>
				<span class="text-xs text-muted-foreground font-mono w-10 text-right">
					{vec2Value[1].toFixed(2)}
				</span>
			</div>
		</div>
	</div>
{:else if field.glslType === 'vec3' || field.glslType === 'vec4'}
	{@const vecValue = (value as number[]) ?? []}
	{@const isColor = ui?.color || vecValue.every((v) => v >= 0 && v <= 1)}
	{#if isColor}
		<div class="space-y-2">
			<Label class="text-xs text-muted-foreground">{label}</Label>
			<ColorInput value={vecValue} onChange={(next) => onChange(next as unknown)} />
		</div>
	{:else}
		<div class="space-y-2">
			<Label class="text-xs text-muted-foreground">{label}</Label>
			{#each vecValue as v, i (i)}
				<div class="flex items-center gap-2">
					<span class="text-xs text-muted-foreground w-4">{['X', 'Y', 'Z', 'W'][i]}</span>
					<Slider
						type="single"
						value={v}
						onValueChange={(newV) => {
							const newVec = [...vecValue];
							newVec[i] = newV as number;
							onChange(newVec);
						}}
						min={ui?.min ?? 0}
						max={ui?.max ?? 1}
						step={ui?.step ?? 0.01}
						class="flex-1"
					/>
				</div>
			{/each}
		</div>
	{/if}
{:else if field.glslType === 'sampler2D'}
	{@const imgValue = value as ImageInputValue | undefined}
	<div class="space-y-2">
		<Label class="text-xs text-muted-foreground">{label}</Label>
		<ImageInputComp
			value={imgValue ?? {
				url: null,
				sourceKind: 'url',
				fit: 'cover',
				offsetX: 0,
				offsetY: 0,
				scale: 1,
				rotation: 0
			}}
			onChange={(next) => onChange(next as unknown)}
		/>
	</div>
{:else if field.glslType === 'vec4Array'}
	{@const arr = value as PaletteValue | undefined}
	{@const max = ui?.array?.maxLength ?? field.arrayLength ?? 10}
	{@const min = ui?.array?.minLength ?? 1}
	<div class="space-y-2">
		<Label class="text-xs text-muted-foreground">{label}</Label>
		<ColorArrayInput
			value={arr ?? { values: [[1, 1, 1, 1]], length: 1 }}
			maxLength={max}
			minLength={min}
			onChange={(next) => onChange(next as unknown)}
		/>
	</div>
{/if}
