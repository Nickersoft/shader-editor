<script lang="ts">
	import { NumberInput } from '@/components/ui/number-input';

	interface Props {
		value: number[];
		onChange: (value: number[]) => void;
	}

	let { value, onChange }: Props = $props();

	let hasAlpha = $derived(value.length === 4);
	let hexValue = $derived(
		`#${value
			.slice(0, 3)
			.map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
			.join('')}`
	);

	function handleHexChange(hex: string) {
		const r = parseInt(hex.slice(1, 3), 16) / 255;
		const g = parseInt(hex.slice(3, 5), 16) / 255;
		const b = parseInt(hex.slice(5, 7), 16) / 255;
		onChange(hasAlpha ? [r, g, b, value[3]] : [r, g, b]);
	}
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2">
		<input
			type="color"
			value={hexValue}
			oninput={(e) => handleHexChange((e.currentTarget as HTMLInputElement).value)}
			class="w-8 h-8 rounded border border-border cursor-pointer"
		/>
		<span class="text-xs text-muted-foreground font-mono">
			{hexValue}
			{#if hasAlpha}
				<span class="opacity-60">{Math.round(value[3] * 100)}%</span>
			{/if}
		</span>
	</div>
	{#if hasAlpha}
		<NumberInput
			label="A"
			value={Math.round(value[3] * 100)}
			onChange={(a) => onChange([value[0], value[1], value[2], a / 100])}
			min={0}
			max={100}
			step={1}
			integer
			suffix="%"
		/>
	{/if}
</div>
