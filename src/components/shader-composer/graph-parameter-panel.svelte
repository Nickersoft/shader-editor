<script lang="ts">
	import { NumberInput } from '@/components/ui/number-input';
	import ColorInput from './color-input.svelte';
	import { GROUP_INPUT_TYPE_ID, type PinType } from '@/shaders/node-graph';
	import type { ProceduralField } from '@/shaders/textures/procedural-field.svelte';

	interface Props {
		field: ProceduralField;
	}

	let { field }: Props = $props();

	type PinDecl = {
		id: string;
		type: PinType;
		label?: string;
		default?: unknown;
	};

	// Locate the (single) GroupInput node — its `pins` config is the layer's
	// user-facing parameter surface. The emitter pulls live values from each
	// pin's `default` field, so the controls below mutate `default` in place.
	let giNode = $derived.by(() => {
		return field.graph.nodes.find((n) => n.typeId === GROUP_INPUT_TYPE_ID) ?? null;
	});

	let pins = $derived.by<PinDecl[]>(() => {
		const node = giNode;
		if (!node) return [];
		const raw = (node.config as { pins?: PinDecl[] }).pins;
		return Array.isArray(raw) ? raw : [];
	});

	function setPin(index: number, value: unknown) {
		if (!giNode) return;
		const cfg = giNode.config as { pins: PinDecl[] };
		const next = [...cfg.pins];
		const existing = next[index];
		if (!existing) return;
		next[index] = { ...existing, default: value };
		cfg.pins = next;
	}

	function asNumber(v: unknown, fallback = 0): number {
		return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
	}

	function asVec3(v: unknown): [number, number, number] {
		if (Array.isArray(v) && v.length >= 3) {
			return [asNumber(v[0]), asNumber(v[1]), asNumber(v[2])];
		}
		return [0, 0, 0];
	}

	function asVec4(v: unknown): [number, number, number, number] {
		if (Array.isArray(v) && v.length >= 4) {
			return [asNumber(v[0]), asNumber(v[1]), asNumber(v[2]), asNumber(v[3], 1)];
		}
		return [0, 0, 0, 1];
	}
</script>

{#if pins.length > 0}
	<section class="px-3 py-3 space-y-4 border-b border-[rgba(255,255,255,0.1)]">
		<div class="px-1">
			<p class="text-[14px] font-medium text-white">Parameters</p>
		</div>
		{#each pins as pin, i (pin.id)}
			{@const label = pin.label ?? pin.id}
			{#if pin.type === 'float'}
				<NumberInput
					{label}
					value={asNumber(pin.default)}
					onChange={(v) => setPin(i, v)}
					step={0.01}
				/>
			{:else if pin.type === 'int'}
				<NumberInput
					{label}
					value={asNumber(pin.default)}
					onChange={(v) => setPin(i, Math.trunc(v))}
					step={1}
					integer
				/>
			{:else if pin.type === 'vec3'}
				<div class="space-y-1.5">
					<p class="text-[12px] text-white/70 px-1">{label}</p>
					<ColorInput
						value={[...asVec3(pin.default), 1]}
						onChange={(v) => setPin(i, [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0])}
					/>
				</div>
			{:else if pin.type === 'vec4'}
				<div class="space-y-1.5">
					<p class="text-[12px] text-white/70 px-1">{label}</p>
					<ColorInput value={asVec4(pin.default)} onChange={(v) => setPin(i, v)} />
				</div>
			{:else if pin.type === 'vec2'}
				{@const v = Array.isArray(pin.default)
					? [asNumber(pin.default[0]), asNumber(pin.default[1])]
					: [0, 0]}
				<div class="space-y-1.5">
					<p class="text-[12px] text-white/70 px-1">{label}</p>
					<div class="grid grid-cols-2 gap-1.5">
						<NumberInput
							label="X"
							value={v[0]}
							onChange={(nv) => setPin(i, [nv, v[1]])}
							step={0.01}
						/>
						<NumberInput
							label="Y"
							value={v[1]}
							onChange={(nv) => setPin(i, [v[0], nv])}
							step={0.01}
						/>
					</div>
				</div>
			{:else if pin.type === 'bool'}
				<label class="flex items-center gap-2 text-[12px] text-white/70 px-1">
					<input
						type="checkbox"
						checked={pin.default === true}
						onchange={(e) => setPin(i, (e.currentTarget as HTMLInputElement).checked)}
					/>
					{label}
				</label>
			{/if}
		{/each}
	</section>
{/if}
