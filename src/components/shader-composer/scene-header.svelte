<script lang="ts">
	import { createDroppable } from '@dnd-kit/svelte';
	import Video from '@lucide/svelte/icons/video';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		open: boolean;
		onToggle: () => void;
	}

	let { open, onToggle }: Props = $props();

	const droppable = createDroppable({ id: 'scene-root', accept: 'effect' });
</script>

<button
	{@attach droppable.attach}
	class="flex items-center gap-2 h-9 w-full rounded-lg pl-3 pr-3 transition-colors"
	class:bg-[var(--surface-hover)]={droppable.isDropTarget}
	class:hover:bg-[var(--surface-hover)]={!droppable.isDropTarget}
	onclick={onToggle}
>
	{#if open}
		<ChevronDown class="size-4 text-white/80 shrink-0" />
	{:else}
		<ChevronRight class="size-4 text-white/80 shrink-0" />
	{/if}
	<Video class="size-4 text-white/80 shrink-0" />
	<span class="text-[14px] font-medium text-white">Scene</span>
</button>
