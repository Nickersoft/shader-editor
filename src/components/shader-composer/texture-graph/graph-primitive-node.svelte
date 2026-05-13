<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
	import { getPrimitive, type PinSpec, type PinType } from '@/shaders/node-graph';

	type PrimitiveNodeData = {
		nodeId: string;
		typeId: string;
		config: Record<string, unknown>;
	};

	type PrimitiveGraphNodeType = Node<PrimitiveNodeData, 'primitive'>;

	let { data, selected }: NodeProps<PrimitiveGraphNodeType> = $props();

	let prim = $derived(getPrimitive(data.typeId));
	let inputs = $derived((prim?.inputs(data.config) ?? []) as readonly PinSpec[]);
	let outputs = $derived((prim?.outputs(data.config) ?? []) as readonly PinSpec[]);

	// Pin-type → handle colour. Matches the Blender convention loosely
	// (scalars grey, vectors aqua, colors yellow) so the eye learns the
	// system quickly without needing labels.
	const PIN_COLOR: Record<PinType, string> = {
		float: '#9ca3af',
		int: '#60a5fa',
		bool: '#f87171',
		vec2: '#22d3ee',
		vec3: '#facc15',
		vec4: '#fb923c'
	};
</script>

<div
	class="rounded-2xl bg-neutral-800 border transition-colors w-[200px] {selected
		? 'border-indigo-400 shadow-[0_0_0_1px_var(--color-indigo-400)]'
		: 'border-white/10'}"
>
	<div class="flex items-center gap-2 px-3 py-2 border-b border-white/5">
		<span
			class="size-3 rounded-[3px] shrink-0"
			style:background-color={prim?.color ?? '#888'}
			aria-hidden="true"
		></span>
		<p class="flex-1 min-w-0 text-[13px] font-medium text-white truncate">
			{prim?.name ?? data.typeId}
		</p>
	</div>
	<div class="px-3 py-2 min-h-[24px]">
		{#if inputs.length === 0 && outputs.length === 0}
			<p class="text-[11px] text-white/40">No pins</p>
		{:else}
			<div class="flex flex-col gap-1">
				{#each inputs as pin (pin.id)}
					<p class="text-[11px] text-white/60 truncate">← {pin.label ?? pin.id}</p>
				{/each}
				{#each outputs as pin (pin.id)}
					<p class="text-[11px] text-white/60 truncate text-right">{pin.label ?? pin.id} →</p>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#each inputs as pin, i (pin.id)}
	{@const total = inputs.length}
	{@const top = total === 1 ? 60 : 40 + (i * 40) / Math.max(1, total - 1)}
	<Handle
		id={pin.id}
		type="target"
		position={Position.Left}
		style="top: {top}%; background: {PIN_COLOR[pin.type]};"
		title="{pin.label ?? pin.id} · {pin.type}"
		isConnectableEnd
		isConnectableStart={false}
	/>
{/each}
{#each outputs as pin, i (pin.id)}
	{@const total = outputs.length}
	{@const top = total === 1 ? 60 : 40 + (i * 40) / Math.max(1, total - 1)}
	<Handle
		id={pin.id}
		type="source"
		position={Position.Right}
		style="top: {top}%; background: {PIN_COLOR[pin.type]};"
		title="{pin.label ?? pin.id} · {pin.type}"
		isConnectableStart
		isConnectableEnd={false}
	/>
{/each}
