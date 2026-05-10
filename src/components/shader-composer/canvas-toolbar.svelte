<script lang="ts">
	import Shapes from '@lucide/svelte/icons/shapes';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Image from '@lucide/svelte/icons/image';
	import Sliders from '@lucide/svelte/icons/sliders-horizontal';
	import { cn } from '@/lib/utils';

	interface Props {
		selected: string | null;
		onSelect: (id: string) => void;
	}

	let { selected, onSelect }: Props = $props();

	const items = [
		{ id: 'shapes', label: 'Shapes', icon: Shapes },
		{ id: 'effects', label: 'Effects', icon: Sparkles },
		{ id: 'textures', label: 'Textures', icon: Image },
		{ id: 'adjustments', label: 'Adjustments', icon: Sliders }
	];
</script>

<div
	class="absolute bottom-4 left-1/2 -translate-x-1/2 glass-floating rounded-full flex items-center gap-2 px-4 py-3"
>
	{#each items as item (item.id)}
		{@const Icon = item.icon}
		{@const isActive = selected === item.id}
		<button
			class={cn(
				'relative flex items-center justify-center p-2 rounded-full transition-colors',
				isActive
					? 'bg-[var(--indigo-700)] border border-[rgba(255,255,255,0.08)] text-white'
					: 'text-white/85 hover:text-white hover:bg-white/5'
			)}
			onclick={() => onSelect(item.id)}
			title={item.label}
			aria-label={item.label}
			aria-pressed={isActive}
		>
			<Icon class="size-[22px]" />
		</button>
	{/each}
</div>
