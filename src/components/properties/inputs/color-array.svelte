<script lang="ts">
	import { NumberInput } from '@/components/ui/number-input';
	import { hexToRgb as parseHex, rgbToHex as formatHex } from '@/lib/color';
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
		return `#${formatHex(c[0] ?? 0, c[1] ?? 0, c[2] ?? 0)}`;
	}

	function hexToRgb(hex: string): [number, number, number] {
		return parseHex(hex) ?? [0, 0, 0];
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
			<NumberInput
				value={Math.round((c[3] ?? 1) * 100)}
				onChange={(a) => updateColor(i, [c[0], c[1], c[2], a / 100])}
				min={0}
				max={100}
				step={1}
				integer
				suffix="%"
				class="w-20"
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
