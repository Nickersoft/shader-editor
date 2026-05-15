<script lang="ts">
	import type { PinDefault, PinSpec } from '@/shaders/node-graph';
	import { NumberInput } from '@/components/ui/number-input';
	import { VecScrubber } from '@/components/ui/vec-scrubber';
	import { ColorSwatch } from '@/components/ui/color-swatch';

	interface Props {
		pin: PinSpec;
		value: PinDefault;
		onDraft: (v: PinDefault) => void;
		onCommit: (v: PinDefault) => void;
		class?: string;
	}

	let { pin, value, onDraft, onCommit, class: klass = 'flex-1 min-w-0' }: Props = $props();
</script>

{#if pin.type === 'float'}
	<NumberInput
		class={klass}
		value={value as number}
		onChange={onDraft}
		onCommit={onCommit}
		step={0.01}
	/>
{:else if pin.type === 'int'}
	<NumberInput
		class={klass}
		value={value as number}
		onChange={onDraft}
		onCommit={onCommit}
		step={1}
		integer
	/>
{:else if pin.type === 'bool'}
	<input
		type="checkbox"
		class="accent-indigo-400 ml-auto"
		checked={Boolean(value)}
		onchange={(e) => onCommit((e.currentTarget as HTMLInputElement).checked)}
	/>
{:else if pin.type === 'vec2'}
	<VecScrubber
		class={klass}
		axes={['X', 'Y']}
		value={value as readonly [number, number]}
		onChange={onDraft}
		onCommit={onCommit}
	/>
{:else if pin.type === 'vec3'}
	{#if pin.subtype === 'color'}
		<ColorSwatch
			class={klass}
			value={value as readonly [number, number, number]}
			onChange={onDraft}
			onCommit={onCommit}
		/>
	{:else}
		<VecScrubber
			class={klass}
			axes={['X', 'Y', 'Z']}
			value={value as readonly [number, number, number]}
			onChange={onDraft}
			onCommit={onCommit}
		/>
	{/if}
{:else if pin.type === 'vec4'}
	{#if pin.subtype === 'color'}
		<ColorSwatch
			class={klass}
			alpha
			value={value as readonly [number, number, number, number]}
			onChange={onDraft}
			onCommit={onCommit}
		/>
	{:else}
		<VecScrubber
			class={klass}
			axes={['X', 'Y', 'Z', 'W']}
			value={value as readonly [number, number, number, number]}
			onChange={onDraft}
			onCommit={onCommit}
		/>
	{/if}
{/if}
