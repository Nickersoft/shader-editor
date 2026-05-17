<script lang="ts">
	import { createSortable } from '@dnd-kit/svelte/sortable';
	import { composer } from '@/lib/state/composer.svelte';
	import { cn } from '@/lib/utils';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	interface Props {
		effectId: string;
		index: number;
		layerId: string | null;
		scope: 'layer' | 'scene';
		depth?: number;
	}

	let { effectId, index, layerId, scope, depth = 2 }: Props = $props();

	let dragId = $derived(
		scope === 'layer' ? `effect:layer:${layerId}:${effectId}` : `effect:scene:${effectId}`
	);

	const sortable = createSortable({
		get id() {
			return dragId;
		},
		get index() {
			return index;
		},
		group: 'effects',
		type: 'effect'
	});

	let node = $derived(composer.scene.findShader(effectId)?.shader);
	let isSelected = $derived(composer.selectedNodeId === effectId);
	let leftPad = $derived(depth === 1 ? 36 : 60);
</script>

{#if node}
	<div
		{@attach sortable.attach}
		class={cn(
			'group/row relative flex items-center gap-2 h-9 rounded-lg pr-2 transition-colors',
			isSelected
				? 'bg-[var(--indigo-700)] text-white'
				: 'bg-[var(--surface-strong)] text-white hover:bg-[var(--surface-hover)]',
			!node.enabled && 'opacity-60',
			sortable.isDragging && 'opacity-50'
		)}
		style="padding-left: {leftPad}px;"
	>
		<span
			class="size-3 rounded-[3px] shrink-0"
			style:background-color={node.meta.color}
			aria-hidden="true"
		></span>

		<button
			{@attach sortable.attachHandle}
			class="flex-1 min-w-0 text-left text-[14px] font-medium truncate cursor-grab active:cursor-grabbing"
			onclick={() => composer.selectNode(effectId)}
			title={node.meta.name}
		>
			{node.meta.name}
		</button>

		<div
			class="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity"
			class:opacity-100={isSelected}
		>
			<button
				class="p-1 text-white/70 hover:text-white"
				onclick={() => composer.toggleNode(effectId)}
				aria-label="Toggle effect"
			>
				{#if node.enabled}
					<Eye class="size-3.5" />
				{:else}
					<EyeOff class="size-3.5" />
				{/if}
			</button>
			<button
				class="p-1 text-white/70 hover:text-white"
				onclick={() => {
					if (scope === 'layer' && layerId) composer.removeEffectFromLayer(layerId, effectId);
					else composer.removeSceneEffect(effectId);
				}}
				aria-label="Remove effect"
			>
				<Trash2 class="size-3.5" />
			</button>
		</div>
	</div>
{/if}
