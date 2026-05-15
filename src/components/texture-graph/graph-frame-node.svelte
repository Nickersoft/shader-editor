<script lang="ts">
	import {
		NodeResizer,
		type NodeProps,
		type Node,
		type OnResize,
	} from '@xyflow/svelte';
	import { composer } from '@/lib/state/composer.svelte';

	type FrameNodeData = {
		frameId: string;
		label: string;
		color: string;
	};

	type FrameGraphNodeType = Node<FrameNodeData, 'frame'>;

	let { data, selected, width, height }: NodeProps<FrameGraphNodeType> = $props();

	// Local label edit state — flips to a contenteditable input on dblclick.
	let editing = $state(false);
	let labelDraft = $state(data.label);
	$effect(() => {
		labelDraft = data.label;
	});

	function commitLabel() {
		editing = false;
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		composer.setFrameLabel(layerId, data.frameId, labelDraft.trim() || 'Group');
	}

	const handleResize: OnResize = (_event, params) => {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		composer.setFrameSize(layerId, data.frameId, {
			width: params.width,
			height: params.height,
		});
	};
</script>

<NodeResizer
	color={data.color}
	minWidth={120}
	minHeight={80}
	isVisible={selected}
	onResize={handleResize}
	lineStyle="border-color: {data.color}; border-width: 1.5px;"
	handleStyle="background-color: {data.color}; width: 8px; height: 8px; border: 1px solid white;"
/>

<div
	class="w-full h-full rounded-xl border-2 transition-colors flex flex-col"
	style:width="{width}px"
	style:height="{height}px"
	style:border-color="color-mix(in srgb, {data.color} 70%, transparent)"
	style:background-color="color-mix(in srgb, {data.color} 8%, transparent)"
>
	<header
		class="flex items-center px-3 py-1.5 rounded-t-[10px] border-b nodrag-children-only"
		style:background-color="color-mix(in srgb, {data.color} 22%, transparent)"
		style:border-color="color-mix(in srgb, {data.color} 35%, transparent)"
	>
		{#if editing}
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="nodrag flex-1 min-w-0 bg-transparent text-[12px] font-semibold text-white outline-none"
				bind:value={labelDraft}
				autofocus
				onblur={commitLabel}
				onkeydown={(e) => {
					if (e.key === 'Enter') commitLabel();
					else if (e.key === 'Escape') {
						labelDraft = data.label;
						editing = false;
					}
				}}
			/>
		{:else}
			<!-- A plain div so xyflow's pointer-down still propagates and selects
			     the frame node; a <button> would absorb the event and the
			     NodeResizer's `isVisible={selected}` would never light up. -->
			<div
				class="flex-1 min-w-0 truncate text-[12px] font-semibold text-white"
				ondblclick={() => (editing = true)}
				title="Double-click to rename"
			>
				{data.label}
			</div>
		{/if}
	</header>
</div>
