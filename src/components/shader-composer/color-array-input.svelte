<script lang="ts">
	import { Slider } from '@/components/ui/slider';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';

	interface PaletteValue {
		values: number[][];
		length: number;
	}

	interface Props {
		value: PaletteValue;
		maxLength: number;
		minLength: number;
		onChange: (value: PaletteValue) => void;
	}

	let { value, maxLength, minLength, onChange }: Props = $props();

	let colors = $derived(value.values.slice(0, value.length));

	function rgbToHex(c: number[]): string {
		return `#${c
			.slice(0, 3)
			.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'))
			.join('')}`;
	}

	function hexToRgb(hex: string): [number, number, number] {
		return [
			parseInt(hex.slice(1, 3), 16) / 255,
			parseInt(hex.slice(3, 5), 16) / 255,
			parseInt(hex.slice(5, 7), 16) / 255
		];
	}

	function updateColor(i: number, next: number[]) {
		const arr = colors.map((c, idx) => (idx === i ? next : c));
		onChange({ values: arr, length: arr.length });
	}
	function addColor() {
		if (colors.length >= maxLength) return;
		const arr = [...colors, [1, 1, 1, 1]];
		onChange({ values: arr, length: arr.length });
	}
	function removeColor(i: number) {
		if (colors.length <= minLength) return;
		const arr = colors.filter((_, idx) => idx !== i);
		onChange({ values: arr, length: arr.length });
	}
</script>

<div class="space-y-1">
	{#each colors as c, i (i)}
		{@const hex = rgbToHex(c)}
		<div class="flex items-center gap-2">
			<input
				type="color"
				value={hex}
				oninput={(e) => {
					const [r, g, b] = hexToRgb((e.currentTarget as HTMLInputElement).value);
					updateColor(i, [r, g, b, c[3] ?? 1]);
				}}
				class="w-7 h-7 rounded border border-border cursor-pointer"
			/>
			<span class="text-[11px] font-mono text-muted-foreground flex-1">{hex}</span>
			<Slider
				type="single"
				value={c[3] ?? 1}
				onValueChange={(a) => updateColor(i, [c[0], c[1], c[2], a as number])}
				min={0}
				max={1}
				step={0.01}
				class="w-16"
			/>
			{#if colors.length > minLength}
				<button
					onclick={() => removeColor(i)}
					class="text-muted-foreground hover:text-destructive p-0.5"
					aria-label="Remove color"
				>
					<Trash2 class="h-3 w-3" />
				</button>
			{/if}
		</div>
	{/each}
	{#if colors.length < maxLength}
		<button
			onclick={addColor}
			class="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground py-1"
		>
			<Plus class="h-3 w-3" /> Add color
		</button>
	{/if}
</div>
