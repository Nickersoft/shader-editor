<script lang="ts">
	import type { Layer } from '@/shaders/core/scene.svelte';
	import {
		EffectNode,
		generatorSourceKind,
		getEffectAppliesTo,
		getEffectScope,
		type NodeClass
	} from '@/shaders/core/node.svelte';
	import { listNodeClasses } from '@/shaders/core/registry';
	import type { Category } from '@/shaders/core/types';
	import { composer } from '@/lib/state/composer.svelte';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import EffectPopover from './effect-popover.svelte';

	interface Props {
		layer: Layer;
	}

	let { layer }: Props = $props();

	// Three sections matching Figma's right-panel grouping. Each section pulls
	// from one or more node categories. The underlying `layer.effects` array is
	// still a single ordered list — these sections are display filters, not
	// separate state buckets, so render order stays predictable across edits.
	const SECTIONS: Array<{
		key: string;
		label: string;
		categories: Category[];
	}> = [
		{ key: 'effects', label: 'Effects', categories: ['shape-effects', 'stylize'] },
		{ key: 'distortions', label: 'Distortions', categories: ['distortion', 'blurs'] },
		{ key: 'adjustments', label: 'Adjustments', categories: ['adjustments'] }
	];

	let sourceKind = $derived(generatorSourceKind(layer.source.cls));

	function pickerOptions(categories: Category[]): NodeClass[] {
		return listNodeClasses()
			.filter((cls) => {
				const proto = (cls as unknown as typeof EffectNode).prototype;
				if (!(proto instanceof EffectNode)) return false;
				if (!categories.includes(cls.meta.category)) return false;
				if (getEffectScope(cls) === 'scene') return false;
				const allowed = getEffectAppliesTo(cls);
				if (allowed.includes('any')) return true;
				return allowed.includes(sourceKind);
			})
			.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
	}

	let groupedEffects = $derived.by(() => {
		const out: Record<string, typeof layer.effects> = {};
		for (const s of SECTIONS) out[s.key] = [];
		for (const fx of layer.effects) {
			for (const s of SECTIONS) {
				if (s.categories.includes(fx.meta.category)) {
					out[s.key].push(fx);
					break;
				}
			}
		}
		return out;
	});

	function handlePick(typeId: string) {
		composer.addEffectToLayer(layer.id, typeId);
	}
</script>

{#each SECTIONS as section (section.key)}
	{@const items = groupedEffects[section.key]}
	{@const options = pickerOptions(section.categories)}
	<section class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)] last:border-b-0">
		<div class="flex items-center justify-between px-1">
			<p class="text-[14px] font-medium text-white">{section.label}</p>
			{#if options.length > 0}
				<DropdownMenuPrimitive.Root>
					<DropdownMenuPrimitive.Trigger
						class="h-6 w-6 p-0 inline-flex items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/5 transition-colors"
						aria-label={`Add ${section.label.toLowerCase()}`}
					>
						<Plus class="size-4" />
					</DropdownMenuPrimitive.Trigger>
					<DropdownMenuPrimitive.Portal>
						<DropdownMenuPrimitive.Content
							side="bottom"
							align="end"
							sideOffset={4}
							class="bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-lg p-1 shadow-md min-w-[160px] z-50 outline-none"
						>
							{#each options as cls (cls.typeId)}
								<DropdownMenuPrimitive.Item
									class="flex items-center gap-2 px-2 py-1.5 text-[13px] rounded-md cursor-pointer text-white/90 hover:bg-white/5 data-highlighted:bg-white/5 outline-none"
									onclick={() => handlePick(cls.typeId)}
								>
									<span
										class="size-2.5 rounded-[3px] shrink-0"
										style:background-color={cls.meta.color}
										aria-hidden="true"
									></span>
									{cls.meta.name}
								</DropdownMenuPrimitive.Item>
							{/each}
						</DropdownMenuPrimitive.Content>
					</DropdownMenuPrimitive.Portal>
				</DropdownMenuPrimitive.Root>
			{/if}
		</div>

		{#if items.length === 0}
			<p class="px-1 text-[12px] text-white/40">
				{options.length === 0
					? `No ${section.label.toLowerCase()} apply to this layer.`
					: `No ${section.label.toLowerCase()} added.`}
			</p>
		{:else}
			<div class="space-y-1">
				{#each items as fx (fx.id)}
					{@const isOpen = composer.openEffectId === fx.id}
					<EffectPopover
						effect={fx}
						open={isOpen}
						onOpenChange={(o) => composer.openEffect(o ? fx.id : null)}
					>
						{#snippet trigger({ props })}
							<div
								{...props}
								class={cn(
									'group/fxrow relative flex items-center gap-2 h-9 rounded-lg px-3 transition-colors w-full cursor-pointer',
									isOpen
										? 'bg-[var(--indigo-700)] text-white'
										: 'bg-[var(--surface-strong)] text-white hover:bg-[var(--surface-hover)]',
									!fx.enabled && 'opacity-60'
								)}
							>
								<span
									class="size-3 rounded-[3px] shrink-0"
									style:background-color={fx.meta.color}
									aria-hidden="true"
								></span>
								<span class="flex-1 min-w-0 text-left text-[13px] font-medium truncate">
									{fx.meta.name}
								</span>
								<span
									class="flex items-center gap-0.5 opacity-0 group-hover/fxrow:opacity-100 transition-opacity"
									class:opacity-100={isOpen}
								>
									<button
										type="button"
										class="p-1 text-white/70 hover:text-white"
										onclick={(e) => {
											e.stopPropagation();
											composer.toggleNode(fx.id);
										}}
										aria-label="Toggle effect"
									>
										{#if fx.enabled}
											<Eye class="size-3.5" />
										{:else}
											<EyeOff class="size-3.5" />
										{/if}
									</button>
									<button
										type="button"
										class="p-1 text-white/70 hover:text-white"
										onclick={(e) => {
											e.stopPropagation();
											composer.removeEffectFromLayer(layer.id, fx.id);
										}}
										aria-label="Remove effect"
									>
										<Trash2 class="size-3.5" />
									</button>
								</span>
							</div>
						{/snippet}
					</EffectPopover>
				{/each}
			</div>
		{/if}
	</section>
{/each}
