<script lang="ts">
	import type { Layer } from '@/shaders/core/scene.svelte';
	import SortableLayerRow from './sortable-layer-row.svelte';
	import Self from './sortable-layer-with-effects.svelte';

	interface Props {
		layer: Layer;
		layerIndex: number;
		isExpanded: boolean;
		onToggleExpanded: () => void;
		expandedLayers: Record<string, boolean>;
		onToggleChildExpanded: (id: string) => void;
		depth?: number;
	}

	let {
		layer,
		layerIndex,
		isExpanded,
		onToggleExpanded,
		expandedLayers,
		onToggleChildExpanded,
		depth = 0
	}: Props = $props();

	let hasChildren = $derived(layer.children.length > 0);
	let displayChildren = $derived([...layer.children].reverse());
</script>

<div class="space-y-1">
	<SortableLayerRow
		{layer}
		index={layerIndex}
		{isExpanded}
		{onToggleExpanded}
		{hasChildren}
		{depth}
	/>
	{#if hasChildren && isExpanded}
		<div class="space-y-1">
			{#each displayChildren as child, i (child.id)}
				<Self
					layer={child}
					layerIndex={i}
					isExpanded={expandedLayers[child.id] ?? true}
					onToggleExpanded={() => onToggleChildExpanded(child.id)}
					{expandedLayers}
					{onToggleChildExpanded}
					depth={depth + 1}
				/>
			{/each}
		</div>
	{/if}
</div>
