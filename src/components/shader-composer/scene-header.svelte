<script lang="ts">
	import Video from '@lucide/svelte/icons/video';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { cn } from '@/lib/utils';

	interface Props {
		open: boolean;
		selected: boolean;
		onToggle: () => void;
		onSelect: () => void;
	}

	let { open, selected, onToggle, onSelect }: Props = $props();
</script>

<div
	class={cn(
		'group/scene flex items-center gap-2 h-9 w-full rounded-lg pl-1 pr-3 transition-colors',
		selected
			? 'bg-[var(--indigo-700)] text-white'
			: 'text-white hover:bg-[var(--surface-hover)]'
	)}
>
	<button
		type="button"
		class="p-1 text-white/80 hover:text-white shrink-0"
		onclick={onToggle}
		aria-label={open ? 'Collapse scene' : 'Expand scene'}
	>
		{#if open}
			<ChevronDown class="size-4" />
		{:else}
			<ChevronRight class="size-4" />
		{/if}
	</button>
	<button
		type="button"
		class="flex flex-1 items-center gap-2 min-w-0 text-left"
		onclick={onSelect}
	>
		<Video class="size-4 text-white/80 shrink-0" />
		<span class="text-[14px] font-medium truncate">Scene</span>
	</button>
</div>
