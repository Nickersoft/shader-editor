<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
	import { defaultForPinType, getPrimitive, PIN_TYPES, type PinType } from '@/shaders/node-graph';
	import { colorForPin } from './pin-color';
	import { composer } from '@/lib/state/composer.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';

	// Pin declaration as stored in the GroupInput node's config. Mirrors the
	// Zod schema in src/shaders/node-graph/primitives/group-input.ts — kept
	// duplicated here so the node component owns the same shape it mutates.
	type PinDecl = {
		id: string;
		type: PinType;
		label?: string;
		default?: unknown;
	};

	type GroupInputNodeData = {
		nodeId: string;
		typeId: string;
		config: { pins?: PinDecl[] };
	};

	type GroupInputGraphNodeType = Node<GroupInputNodeData, 'group-input'>;

	let { data, selected }: NodeProps<GroupInputGraphNodeType> = $props();

	// Geometry mirrors graph-primitive-node.svelte so handle dots line up with
	// row text baselines. The "add input" button at the foot adds a fixed
	// trailing row that has no handle.
	const HEADER_H = 34;
	const PIN_ROW_H = 32;
	const FOOTER_H = 30;

	let prim = $derived(getPrimitive(data.typeId));
	let pins = $derived<PinDecl[]>(Array.isArray(data.config.pins) ? data.config.pins : []);

	let categoryColor = $derived(prim?.color ?? '#22c55e');
	let displayTitle = $derived(prim?.displayTitle?.(data.config) ?? 'Group Input');

	let outputOffsets = $derived(pins.map((_, i) => HEADER_H + i * PIN_ROW_H + PIN_ROW_H / 2));

	// All structural mutations replace the `pins` array reference so the
	// shader's structural fingerprint ticks and the GLSL recompiles.
	function withGraphAndConfig(
		fn: (cfg: { pins: PinDecl[] }, graph: ReturnType<typeof composer.activeGraphFor>) => void,
	) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		const graph = composer.activeGraphFor(layerId);
		if (!graph) return;
		const node = graph.nodes.find((n) => n.id === data.nodeId);
		if (!node) return;
		fn(node.config as { pins: PinDecl[] }, graph);
	}

	function addPin() {
		withGraphAndConfig((cfg) => {
			const next = [...(cfg.pins ?? [])];
			let i = 1;
			let id = 'param';
			const existing = new Set(next.map((p) => p.id));
			while (existing.has(id)) {
				i += 1;
				id = `param${i}`;
			}
			next.push({ id, type: 'float', label: id, default: 0 });
			cfg.pins = next;
		});
	}

	function removePin(index: number) {
		withGraphAndConfig((cfg, graph) => {
			const removed = cfg.pins?.[index];
			if (!removed || !graph) return;
			// Drop edges sourced from this pin so the emitted GLSL doesn't
			// reference a vanished local.
			graph.edges = graph.edges.filter(
				(e) => !(e.fromNodeId === data.nodeId && e.fromPin === removed.id),
			);
			cfg.pins = cfg.pins.filter((_, i) => i !== index);
		});
	}

	// Drag-reorder state. The grip on each row is the only `draggable=true`
	// element, so xyflow's pointer drag (suppressed via the row's `nodrag`
	// class) and the HTML5 drag don't compete. `dragOverIndex` tracks the row
	// the cursor is currently above so we can render a drop indicator above
	// or below it depending on direction of travel.
	let draggingIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function handleDragStart(i: number, e: DragEvent) {
		draggingIndex = i;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			// A payload is required for Firefox to fire `drop`.
			e.dataTransfer.setData('text/plain', String(i));
		}
	}

	function handleDragOver(i: number, e: DragEvent) {
		if (draggingIndex === null) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		if (dragOverIndex !== i) dragOverIndex = i;
	}

	function handleDrop(i: number, e: DragEvent) {
		e.preventDefault();
		const from = draggingIndex;
		draggingIndex = null;
		dragOverIndex = null;
		if (from === null || from === i) return;
		movePinTo(from, i);
	}

	function handleDragEnd() {
		draggingIndex = null;
		dragOverIndex = null;
	}

	function movePinTo(from: number, to: number) {
		withGraphAndConfig((cfg) => {
			if (from < 0 || from >= cfg.pins.length) return;
			if (to < 0 || to >= cfg.pins.length) return;
			const next = [...cfg.pins];
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			cfg.pins = next;
		});
	}

	function setType(index: number, type: PinType) {
		withGraphAndConfig((cfg) => {
			const next = [...cfg.pins];
			const existing = next[index];
			if (!existing || existing.type === type) return;
			// Reset the stored default when the type changes — a vec3 default
			// can't survive a switch to float.
			next[index] = { ...existing, type, default: defaultForPinType(type) };
			cfg.pins = next;
		});
	}

	function renameId(index: number, newId: string) {
		withGraphAndConfig((cfg, graph) => {
			const existing = cfg.pins[index];
			if (!existing || !graph) return;
			const trimmed = newId.trim();
			if (!trimmed || trimmed === existing.id) return;
			if (cfg.pins.some((p, i) => i !== index && p.id === trimmed)) return;
			const oldId = existing.id;
			graph.edges = graph.edges.map((e) =>
				e.fromNodeId === data.nodeId && e.fromPin === oldId
					? { ...e, fromPin: trimmed }
					: e,
			);
			const next = [...cfg.pins];
			next[index] = { ...existing, id: trimmed, label: existing.label ?? trimmed };
			cfg.pins = next;
		});
	}
</script>

<div
	class="rounded-xl bg-neutral-800 border transition-colors w-[240px] overflow-hidden {selected
		? 'border-indigo-400 shadow-[0_0_0_1px_var(--color-indigo-400)]'
		: 'border-white/10'}"
>
	<div
		class="flex items-stretch border-b border-white/10"
		style:height="{HEADER_H}px"
		style:background-color="color-mix(in srgb, {categoryColor} 18%, transparent)"
	>
		<span
			class="self-center ml-3 size-2.5 rounded-[3px] shrink-0"
			style:background-color={categoryColor}
			aria-hidden="true"
		></span>
		<p class="flex-1 min-w-0 self-center pl-2 text-[13px] font-medium text-white truncate">
			{displayTitle}
		</p>
		<span
			class="self-center mr-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide rounded-[3px] text-white/60"
			style:background-color="color-mix(in srgb, {categoryColor} 22%, transparent)"
		>
			group
		</span>
	</div>

	{#each pins as pin, i (pin.id)}
		{@const isDragging = draggingIndex === i}
		{@const isDropTarget = draggingIndex !== null && dragOverIndex === i && draggingIndex !== i}
		{@const dropAbove = isDropTarget && (draggingIndex ?? -1) > i}
		{@const dropBelow = isDropTarget && (draggingIndex ?? -1) < i}
		<div
			class="relative flex items-center gap-1 pl-1 pr-3 text-[11px] text-white/70 nodrag transition-opacity"
			class:opacity-40={isDragging}
			style:height="{PIN_ROW_H}px"
			ondragover={(e) => handleDragOver(i, e)}
			ondrop={(e) => handleDrop(i, e)}
			ondragend={handleDragEnd}
			role="listitem"
		>
			{#if dropAbove}
				<span
					class="pointer-events-none absolute left-2 right-2 top-0 h-0.5 rounded bg-indigo-400"
					aria-hidden="true"
				></span>
			{/if}
			{#if dropBelow}
				<span
					class="pointer-events-none absolute left-2 right-2 bottom-0 h-0.5 rounded bg-indigo-400"
					aria-hidden="true"
				></span>
			{/if}
			<button
				class="p-0.5 text-white/30 hover:text-white cursor-grab active:cursor-grabbing"
				draggable="true"
				ondragstart={(e) => handleDragStart(i, e)}
				aria-label="Drag to reorder"
				title="Drag to reorder"
			>
				<GripVertical class="size-3" />
			</button>
			<input
				class="flex-1 min-w-0 bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
				value={pin.id}
				onchange={(e) => renameId(i, (e.currentTarget as HTMLInputElement).value)}
				aria-label="Pin id"
			/>
			<select
				class="bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded px-1 py-0.5 text-[10px] text-white/70 focus:outline-none"
				value={pin.type}
				onchange={(e) =>
					setType(i, (e.currentTarget as HTMLSelectElement).value as PinType)}
				aria-label="Pin type"
			>
				{#each PIN_TYPES as t (t)}
					<option value={t}>{t}</option>
				{/each}
			</select>
			<button
				class="p-0.5 text-white/30 hover:text-red-400"
				onclick={() => removePin(i)}
				aria-label="Remove pin"
				title="Remove input"
			>
				<Trash class="size-2.5" />
			</button>
		</div>
	{/each}

	<button
		class="w-full flex items-center justify-center gap-1.5 text-[11px] text-white/40 hover:text-white border-t border-white/10 hover:bg-white/5 nodrag"
		style:height="{FOOTER_H}px"
		onclick={addPin}
	>
		<Plus class="size-3" />
		Add input
	</button>
</div>

{#each pins as pin, i (pin.id)}
	<Handle
		id={pin.id}
		type="source"
		position={Position.Right}
		style="top: {outputOffsets[i]}px; background: {colorForPin({
			id: pin.id,
			type: pin.type,
			label: pin.label,
		})};"
		title="{pin.label ?? pin.id} · {pin.type}"
		isConnectableStart
		isConnectableEnd={false}
	/>
{/each}
