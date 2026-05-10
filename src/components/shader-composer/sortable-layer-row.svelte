<script lang="ts">
	import { createSortable } from '@dnd-kit/svelte/sortable';
	import type { Layer } from '@/shaders/core/scene.svelte';
	import { composer } from '@/lib/state/composer.svelte';
	import { cn } from '@/lib/utils';
	import * as ContextMenu from '@/components/ui/context-menu';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Scissors from '@lucide/svelte/icons/scissors';

	interface Props {
		layer: Layer;
		index: number;
		isExpanded: boolean;
		onToggleExpanded: () => void;
		hasChildren?: boolean;
		depth?: number;
	}

	let {
		layer,
		index,
		isExpanded,
		onToggleExpanded,
		hasChildren = false,
		depth = 0
	}: Props = $props();

	const sortable = createSortable({
		get id() {
			return `layer:${layer.id}`;
		},
		get index() {
			return index;
		},
		group: 'layers',
		type: 'layer',
		accept: ['layer']
	});

	let isSelected = $derived(composer.selectedNodeId === layer.source.id);
	let meta = $derived(layer.source.meta);
	let isNestTarget = $derived(sortable.isDropTarget && !sortable.isDragging);

	// Candidate parents = every other top-level layer plus their descendants,
	// minus this layer's own subtree (would create a cycle). For v1 we list all
	// top-level layers; nesting deeper requires a follow-up to traverse.
	let nestCandidates = $derived(
		composer.scene.layers.filter((l) => l.id !== layer.id)
	);
	let isNested = $derived(composer.scene.findLayerParent(layer.id) ?? null);
	// Padding scales with depth — 36px for top-level (matches old behavior),
	// +16px per nest level so children visibly indent under their parent.
	let leftPad = $derived(36 + depth * 16);
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div
			{@attach sortable.attach}
			class={cn(
				'group/row relative flex items-center gap-2 h-9 rounded-lg pr-2 transition-colors',
				isSelected
					? 'bg-[var(--indigo-700)] text-white'
					: 'text-white hover:bg-[var(--surface-hover)]',
				!layer.enabled && 'opacity-60',
				sortable.isDragging && 'opacity-50',
				isNestTarget && 'ring-2 ring-inset ring-[var(--indigo-600)] bg-[var(--surface-hover)]'
			)}
			style="padding-left: {leftPad}px;"
		>
			{#if hasChildren}
				<button
					class="absolute top-1/2 -translate-y-1/2 p-0.5 text-white/80 hover:text-white"
					style="left: {leftPad - 24}px;"
					onclick={onToggleExpanded}
					aria-label={isExpanded ? 'Collapse children' : 'Expand children'}
				>
					{#if isExpanded}
						<ChevronDown class="size-4" />
					{:else}
						<ChevronRight class="size-4" />
					{/if}
				</button>
			{/if}

			{#if layer.useAsMask}
				<Scissors class="size-3.5 shrink-0 text-white/80" aria-label="Mask layer" />
			{:else}
				<span
					class="size-3.5 rounded-[3px] shrink-0"
					style:background-color={meta.color}
					aria-hidden="true"
				></span>
			{/if}

			<button
				{@attach sortable.attachHandle}
				class="flex-1 min-w-0 text-left text-[14px] font-medium truncate cursor-grab active:cursor-grabbing"
				onclick={() => composer.selectNode(layer.source.id)}
				title={layer.name}
			>
				{layer.name}
			</button>

			<div
				class="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity"
				class:opacity-100={isSelected}
			>
				<button
					class="p-1 text-white/70 hover:text-white"
					onclick={() => composer.toggleLayer(layer.id)}
					aria-label="Toggle visibility"
				>
					{#if layer.enabled}
						<Eye class="size-3.5" />
					{:else}
						<EyeOff class="size-3.5" />
					{/if}
				</button>
				<button
					class="p-1 text-white/70 hover:text-white"
					onclick={() => composer.removeLayer(layer.id)}
					aria-label="Remove layer"
				>
					<Trash2 class="size-3.5" />
				</button>
			</div>
		</div>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		{#if nestCandidates.length > 0}
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger>Clip into…</ContextMenu.SubTrigger>
				<ContextMenu.SubContent>
					{#each nestCandidates as parent (parent.id)}
						<ContextMenu.Item
							onclick={() => composer.nestLayerAsChild(layer.id, parent.id)}
						>
							{parent.name}
						</ContextMenu.Item>
					{/each}
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
		{/if}
		{#if isNested}
			<ContextMenu.Item onclick={() => composer.unnestLayer(layer.id)}>
				Move out of clip group
			</ContextMenu.Item>
		{/if}
		<ContextMenu.CheckboxItem
			checked={layer.useAsMask}
			onCheckedChange={() => composer.toggleLayerMask(layer.id)}
		>
			Use as mask
		</ContextMenu.CheckboxItem>
		<ContextMenu.Separator />
		<ContextMenu.Item onclick={() => composer.removeLayer(layer.id)}>
			Delete layer
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
