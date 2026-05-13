<script lang="ts">
	import { NumberInput } from '@/components/ui/number-input';
	import ColorInput from './color-input.svelte';
	import { GROUP_INPUT_TYPE_ID, type PinType } from '@/shaders/node-graph';
	import type { ProceduralField } from '@/shaders/textures/procedural-field.svelte';
	import Settings from '@lucide/svelte/icons/settings-2';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';

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

	const PIN_TYPES: readonly PinType[] = ['float', 'int', 'bool', 'vec2', 'vec3', 'vec4'];

	let editing = $state(false);

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

	// All structural pin mutations replace the `pins` array reference so
	// `structuralKey` ticks and the shader recompiles. Live-value writes (in
	// `setPin`) also replace the array, but the per-pin live-value path is
	// excluded from the structural key so they don't trigger a rebuild.
	function setPin(index: number, value: unknown) {
		const node = giNode;
		if (!node) return;
		const cfg = node.config as { pins: PinDecl[] };
		const next = [...cfg.pins];
		const existing = next[index];
		if (!existing) return;
		next[index] = { ...existing, default: value };
		cfg.pins = next;
	}

	function updatePin(index: number, patch: Partial<PinDecl>) {
		const node = giNode;
		if (!node) return;
		const cfg = node.config as { pins: PinDecl[] };
		const next = [...cfg.pins];
		const existing = next[index];
		if (!existing) return;
		const merged = { ...existing, ...patch };
		// Reset the default value when the type changes so the stored shape
		// stays valid (a vec3 default can't survive a switch to float).
		if (patch.type && patch.type !== existing.type) {
			merged.default = defaultFor(patch.type);
		}
		next[index] = merged;
		cfg.pins = next;
	}

	function addPin() {
		const node = giNode;
		if (!node) return;
		const cfg = node.config as { pins: PinDecl[] };
		const next = [...cfg.pins];
		// Mint a unique id: param, param2, param3 …
		let i = 1;
		let id = 'param';
		const existing = new Set(next.map((p) => p.id));
		while (existing.has(id)) {
			i += 1;
			id = `param${i}`;
		}
		next.push({ id, type: 'float', label: id, default: 0 });
		cfg.pins = next;
	}

	function removePin(index: number) {
		const node = giNode;
		if (!node) return;
		const cfg = node.config as { pins: PinDecl[] };
		const removed = cfg.pins[index];
		if (!removed) return;
		// Also drop any edges sourced from this pin — keeping them would
		// leave the emitted GLSL referencing a non-existent local.
		field.graph.edges = field.graph.edges.filter(
			(e) => !(e.fromNodeId === node.id && e.fromPin === removed.id),
		);
		cfg.pins = cfg.pins.filter((_, i) => i !== index);
	}

	function movePin(index: number, dir: -1 | 1) {
		const node = giNode;
		if (!node) return;
		const cfg = node.config as { pins: PinDecl[] };
		const target = index + dir;
		if (target < 0 || target >= cfg.pins.length) return;
		const next = [...cfg.pins];
		const tmp = next[index];
		next[index] = next[target];
		next[target] = tmp;
		cfg.pins = next;
	}

	function renameId(index: number, newId: string) {
		const node = giNode;
		if (!node) return;
		const cfg = node.config as { pins: PinDecl[] };
		const existing = cfg.pins[index];
		if (!existing || existing.id === newId) return;
		// Reject duplicates and empty.
		const trimmed = newId.trim();
		if (!trimmed || cfg.pins.some((p, i) => i !== index && p.id === trimmed)) return;
		const oldId = existing.id;
		// Rewire any edges that referenced the old id.
		field.graph.edges = field.graph.edges.map((e) =>
			e.fromNodeId === node.id && e.fromPin === oldId ? { ...e, fromPin: trimmed } : e,
		);
		const next = [...cfg.pins];
		next[index] = { ...existing, id: trimmed };
		cfg.pins = next;
	}

	function defaultFor(type: PinType): unknown {
		switch (type) {
			case 'float':
				return 0;
			case 'int':
				return 0;
			case 'bool':
				return false;
			case 'vec2':
				return [0, 0];
			case 'vec3':
				return [0, 0, 0];
			case 'vec4':
				return [0, 0, 0, 1];
		}
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

{#if giNode}
	<section class="px-3 py-3 space-y-4 border-b border-[rgba(255,255,255,0.1)]">
		<div class="flex items-center justify-between px-1">
			<p class="text-[14px] font-medium text-white">Parameters</p>
			<button
				class="p-1 rounded {editing
					? 'text-indigo-300 bg-white/10'
					: 'text-white/60 hover:text-white hover:bg-white/5'}"
				onclick={() => (editing = !editing)}
				title={editing ? 'Done editing' : 'Edit pins'}
				aria-label="Edit pins"
				aria-pressed={editing}
			>
				<Settings class="size-3.5" />
			</button>
		</div>

		{#if editing}
			<div class="space-y-2">
				{#each pins as pin, i (pin.id)}
					<div class="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1.5">
						<input
							class="flex-1 min-w-0 bg-transparent text-[12px] text-white focus:outline-none"
							value={pin.id}
							onchange={(e) => renameId(i, (e.currentTarget as HTMLInputElement).value)}
							aria-label="Pin id"
						/>
						<select
							class="bg-transparent text-[11px] text-white/70 rounded focus:outline-none"
							value={pin.type}
							onchange={(e) =>
								updatePin(i, { type: (e.currentTarget as HTMLSelectElement).value as PinType })}
							aria-label="Pin type"
						>
							{#each PIN_TYPES as t (t)}
								<option value={t}>{t}</option>
							{/each}
						</select>
						<button
							class="p-1 text-white/40 hover:text-white disabled:opacity-30"
							onclick={() => movePin(i, -1)}
							disabled={i === 0}
							aria-label="Move pin up"
						>
							<ArrowUp class="size-3" />
						</button>
						<button
							class="p-1 text-white/40 hover:text-white disabled:opacity-30"
							onclick={() => movePin(i, 1)}
							disabled={i === pins.length - 1}
							aria-label="Move pin down"
						>
							<ArrowDown class="size-3" />
						</button>
						<button
							class="p-1 text-white/40 hover:text-red-400"
							onclick={() => removePin(i)}
							aria-label="Remove pin"
						>
							<Trash class="size-3" />
						</button>
					</div>
				{/each}
				<button
					class="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[12px] text-white/60 hover:text-white border border-dashed border-white/15 rounded-md"
					onclick={addPin}
				>
					<Plus class="size-3" />
					Add parameter
				</button>
				{#if pins.length === 0}
					<p class="text-[11px] text-white/40 text-center py-2">
						No parameters yet. Add one to expose a control on this layer.
					</p>
				{/if}
			</div>
		{:else if pins.length > 0}
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
		{:else}
			<p class="text-[11px] text-white/40 text-center py-2">
				No parameters. Click the settings icon to add one.
			</p>
		{/if}
	</section>
{/if}
