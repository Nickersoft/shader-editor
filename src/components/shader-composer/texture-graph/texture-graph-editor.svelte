<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Controls,
		type Node as XYNode,
		type Edge as XYEdge,
		type NodeTypes,
		type Connection
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	import X from '@lucide/svelte/icons/x';
	import Plus from '@lucide/svelte/icons/plus';

	import { composer } from '@/lib/state/composer.svelte';
	import { ProceduralField } from '@/shaders/textures/procedural-field.svelte';
	import { listPrimitives } from '@/shaders/node-graph';

	import GraphPrimitiveNode from './graph-primitive-node.svelte';
	import GraphPalette from './graph-palette.svelte';

	const nodeTypes: NodeTypes = { primitive: GraphPrimitiveNode };

	let layer = $derived.by(() => {
		const id = composer.editingTextureLayerId;
		if (!id) return null;
		return composer.scene.findLayer(id) ?? null;
	});

	let proceduralField = $derived.by(() => {
		const src = layer?.source;
		return src instanceof ProceduralField ? src : null;
	});

	let nodes = $derived.by<XYNode[]>(() => {
		const field = proceduralField;
		if (!field) return [];
		return field.graph.nodes.map((n) => ({
			id: n.id,
			type: 'primitive',
			position: n.position,
			data: { nodeId: n.id, typeId: n.typeId, config: n.config },
			draggable: true,
			deletable: n.typeId !== 'group-input' && n.typeId !== 'group-output'
		}));
	});

	let edges = $derived.by<XYEdge[]>(() => {
		const field = proceduralField;
		if (!field) return [];
		return field.graph.edges.map((e) => ({
			id: `${e.fromNodeId}.${e.fromPin}->${e.toNodeId}.${e.toPin}`,
			source: e.fromNodeId,
			sourceHandle: e.fromPin,
			target: e.toNodeId,
			targetHandle: e.toPin,
			animated: false,
			selectable: true,
			deletable: true,
			style: 'stroke: #818cf8; stroke-width: 2;'
		}));
	});

	let paletteOpen = $state(false);

	function handleClose() {
		composer.closeTextureEditor();
	}

	function handlePick(typeId: string) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		// Drop new nodes near canvas centre; the user will reposition.
		composer.addGraphNode(layerId, typeId, { x: 240, y: 180 });
		paletteOpen = false;
	}

	function handleConnect(connection: Connection) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		const { source, target, sourceHandle, targetHandle } = connection;
		if (!source || !target || !sourceHandle || !targetHandle) return;
		composer.connectGraphEdge(layerId, {
			fromNodeId: source,
			fromPin: sourceHandle,
			toNodeId: target,
			toPin: targetHandle
		});
	}

	function handleDelete({ nodes: dNodes, edges: dEdges }: { nodes: XYNode[]; edges: XYEdge[] }) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		for (const e of dEdges) {
			if (!e.target || !e.targetHandle) continue;
			composer.disconnectGraphEdge(layerId, {
				toNodeId: e.target,
				toPin: e.targetHandle
			});
		}
		for (const n of dNodes) {
			composer.removeGraphNode(layerId, n.id);
		}
	}

	function handleNodeDragStop({ targetNode }: { targetNode: XYNode | null }) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId || !targetNode) return;
		composer.setGraphNodePosition(layerId, targetNode.id, {
			x: targetNode.position.x,
			y: targetNode.position.y
		});
	}

	let primitives = $derived(
		listPrimitives()
			.filter((p) => p.typeId !== 'group-input' && p.typeId !== 'group-output')
			.sort((a, b) => a.name.localeCompare(b.name))
	);
</script>

<svelte:window
	on:keydown={(e) => {
		if (!proceduralField) return;
		if (e.key === 'Escape') {
			if (paletteOpen) paletteOpen = false;
			else handleClose();
		}
	}}
/>

{#if proceduralField && layer}
	<section
		class="w-full h-full bg-neutral-950 flex flex-col"
		aria-label="Node graph editor"
	>
		<header
			class="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-neutral-900 shrink-0"
		>
			<div class="flex items-center gap-3 min-w-0">
				<span
					class="size-4 rounded-[4px] shrink-0"
					style:background-color={proceduralField.meta.color}
					aria-hidden="true"
				></span>
				<div class="flex flex-col min-w-0">
					<p class="text-[14px] font-medium text-white truncate">{layer.name}</p>
					<p class="text-[12px] text-white/50">Node graph</p>
				</div>
			</div>
			<button
				class="p-1.5 text-white/70 hover:text-white rounded-md hover:bg-white/5"
				onclick={handleClose}
				aria-label="Close node graph editor"
				title="Close (Esc)"
			>
				<X class="size-4" />
			</button>
		</header>

		<div class="flex-1 relative min-h-0">
			<SvelteFlow
				{nodes}
				{edges}
				{nodeTypes}
				nodesDraggable
				nodesConnectable
				elementsSelectable
				onconnect={handleConnect}
				ondelete={handleDelete}
				onnodedragstop={handleNodeDragStop}
				fitView
				fitViewOptions={{ padding: 0.25 }}
				proOptions={{ hideAttribution: true }}
			>
				<Background patternColor="rgba(255,255,255,0.08)" gap={24} />
				<Controls showLock={false} />
			</SvelteFlow>

			<div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
				{#if paletteOpen}
					<GraphPalette
						{primitives}
						onPick={handlePick}
						onClose={() => (paletteOpen = false)}
					/>
				{/if}
				<button
					class="rounded-full inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-neutral-800/95 border border-white/15 shadow-2xl backdrop-blur-md hover:bg-neutral-700/95 transition"
					onclick={() => (paletteOpen = !paletteOpen)}
					aria-expanded={paletteOpen}
				>
					<Plus class="size-4" />
					Add node
				</button>
			</div>
		</div>
	</section>
{/if}

<style>
	:global(.svelte-flow) {
		background: transparent;
	}
	:global(.svelte-flow__edge-path) {
		stroke: rgba(255, 255, 255, 0.4);
		stroke-width: 1.5;
	}
	:global(.svelte-flow__handle) {
		background: rgba(255, 255, 255, 0.55);
		border: 2px solid var(--surface-base, #0b0b10);
		width: 12px;
		height: 12px;
	}
	:global(.svelte-flow__controls) {
		background: rgb(38, 38, 38);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		overflow: hidden;
	}
	:global(.svelte-flow__controls-button) {
		background: transparent;
		border-color: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
	}
	:global(.svelte-flow__controls-button:hover) {
		background: rgba(255, 255, 255, 0.05);
		color: white;
	}
	:global(.svelte-flow__controls-button svg) {
		fill: currentColor;
	}
</style>
