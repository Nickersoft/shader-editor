<script lang="ts">
	import type { NodePrimitive } from '@/shaders/node-graph';

	interface Props {
		primitives: readonly NodePrimitive[];
		onPick: (typeId: string) => void;
		onClose: () => void;
	}

	let { primitives, onPick, onClose }: Props = $props();
</script>

<div
	class="rounded-2xl w-[300px] max-h-[60vh] flex flex-col z-20 overflow-hidden bg-neutral-800/95 border border-white/15 shadow-2xl backdrop-blur-md"
>
	<div class="flex items-center justify-between px-4 py-3 shrink-0">
		<p class="text-[14px] font-medium text-white tracking-[-0.32px]">Add node</p>
		<button
			class="text-white/60 hover:text-white text-[12px]"
			onclick={onClose}
			aria-label="Close palette"
		>
			Cancel
		</button>
	</div>

	<div class="flex flex-col gap-1 px-2 pb-2 overflow-y-auto">
		{#each primitives as prim (prim.typeId)}
			<button
				class="flex items-start gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
				onclick={() => onPick(prim.typeId)}
			>
				<span
					class="size-3 rounded-[3px] shrink-0 mt-1"
					style:background-color={prim.color ?? '#888'}
					aria-hidden="true"
				></span>
				<div class="flex-1 min-w-0">
					<p class="text-[13px] font-medium text-white">{prim.name}</p>
					{#if prim.description}
						<p class="text-[11px] text-white/50 mt-0.5 line-clamp-2">
							{prim.description}
						</p>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>
