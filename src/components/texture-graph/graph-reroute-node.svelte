<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
	import { getPrimitive, type PinType } from '@/shaders/node-graph';
	import { colorForPinType } from './pin-color';

	type RerouteNodeData = {
		nodeId: string;
		typeId: string;
		config: Record<string, unknown>;
	};

	type RerouteGraphNodeType = Node<RerouteNodeData, 'reroute'>;

	let { data, selected }: NodeProps<RerouteGraphNodeType> = $props();

	let prim = $derived(getPrimitive(data.typeId));
	let pinType = $derived(((data.config.pinType as PinType | undefined) ?? 'float') as PinType);
	let dotColor = $derived(colorForPinType(pinType));
	let label = $derived(prim?.displayTitle?.(data.config) ?? `Reroute · ${pinType}`);
</script>

<div
	class="rounded-full border transition-colors {selected
		? 'border-indigo-400 shadow-[0_0_0_2px_var(--color-indigo-400)]'
		: 'border-white/20'}"
	style:width="14px"
	style:height="14px"
	style:background-color={dotColor}
	title={label}
></div>

<Handle
	id="in"
	type="target"
	position={Position.Left}
	style="background: {dotColor}; left: 0px;"
	isConnectableEnd
	isConnectableStart={false}
/>
<Handle
	id="out"
	type="source"
	position={Position.Right}
	style="background: {dotColor}; right: 0px;"
	isConnectableStart
	isConnectableEnd={false}
/>
