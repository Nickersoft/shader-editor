<script lang="ts">
	import { tick } from 'svelte';
	import type { NodePrimitive } from '@/shaders/node-graph';

	interface Props {
		primitives: readonly NodePrimitive[];
		onPick: (typeId: string) => void;
		onClose: () => void;
	}

	let { primitives, onPick, onClose }: Props = $props();

	let query = $state('');
	let highlightedIndex = $state(0);
	let searchInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		// Autofocus the search input when the palette mounts so the user can
		// start typing immediately.
		void primitives;
		tick().then(() => searchInput?.focus());
	});

	// `category` is optional on a primitive; everything without one collapses
	// into "Other" so the section list is always exhaustive.
	const CATEGORY_LABELS: Record<string, string> = {
		input: 'Input',
		texture: 'Texture',
		color: 'Color',
		vector: 'Vector',
		converter: 'Converter',
		group: 'Group',
		other: 'Other'
	};

	const CATEGORY_ORDER: readonly string[] = [
		'input',
		'texture',
		'color',
		'vector',
		'converter',
		'group',
		'other'
	];

	type Group = { key: string; label: string; items: readonly NodePrimitive[] };

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return primitives;
		return primitives.filter((p) => {
			const hay =
				`${p.name} ${p.typeId} ${p.description ?? ''} ${p.category ?? ''}`.toLowerCase();
			return hay.includes(q);
		});
	});

	let groups = $derived.by<Group[]>(() => {
		const byCat = new Map<string, NodePrimitive[]>();
		for (const p of filtered) {
			const cat = p.category ?? 'other';
			let bucket = byCat.get(cat);
			if (!bucket) {
				bucket = [];
				byCat.set(cat, bucket);
			}
			bucket.push(p);
		}
		const out: Group[] = [];
		for (const cat of CATEGORY_ORDER) {
			const items = byCat.get(cat);
			if (items) out.push({ key: cat, label: CATEGORY_LABELS[cat] ?? cat, items });
			byCat.delete(cat);
		}
		// Any remaining categories that aren't in the canonical order get
		// appended alphabetically — keeps future categories visible without
		// silently dropping them off the bottom.
		for (const [cat, items] of Array.from(byCat).sort(([a], [b]) => a.localeCompare(b))) {
			out.push({ key: cat, label: CATEGORY_LABELS[cat] ?? cat, items });
		}
		return out;
	});

	// Flat list for keyboard navigation — keeps the up/down arrow contract
	// consistent regardless of section grouping.
	let flatList = $derived.by(() => groups.flatMap((g) => g.items));

	// Pre-indexed positions so the per-row hover/highlight check is O(1)
	// instead of O(N) via Array.indexOf — the template renders one row per
	// primitive, so a linear scan there is O(N²) per keystroke.
	let flatIndex = $derived.by(() => {
		const m = new Map<NodePrimitive, number>();
		for (let i = 0; i < flatList.length; i++) m.set(flatList[i], i);
		return m;
	});

	$effect(() => {
		void flatList;
		highlightedIndex = 0;
	});

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedIndex = Math.min(flatList.length - 1, highlightedIndex + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedIndex = Math.max(0, highlightedIndex - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const pick = flatList[highlightedIndex];
			if (pick) onPick(pick.typeId);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	}
</script>

<div
	class="rounded-2xl w-[320px] max-h-[60vh] flex flex-col z-20 overflow-hidden bg-neutral-800/95 border border-white/15 shadow-2xl backdrop-blur-md"
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

	<div class="px-3 pb-3 shrink-0">
		<input
			bind:this={searchInput}
			bind:value={query}
			onkeydown={onKeyDown}
			placeholder="Search primitives…"
			class="w-full h-9 px-3 text-[13px] rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
		/>
	</div>

	<div class="flex flex-col gap-1 px-2 pb-2 overflow-y-auto">
		{#if flatList.length === 0}
			<p class="text-[12px] text-white/40 text-center py-6">No matches</p>
		{:else}
			{#each groups as group (group.key)}
				<p class="text-[10px] uppercase tracking-wider text-white/40 px-3 pt-2 pb-1">
					{group.label}
				</p>
				{#each group.items as prim (prim.typeId)}
					{@const flatIdx = flatIndex.get(prim) ?? -1}
					{@const isHighlighted = flatIdx === highlightedIndex}
					<button
						class="flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors {isHighlighted
							? 'bg-white/10'
							: 'hover:bg-white/5'}"
						onclick={() => onPick(prim.typeId)}
						onmouseenter={() => (highlightedIndex = flatIdx)}
					>
						<span
							class="size-3 rounded-[3px] shrink-0 mt-1"
							style:background-color={prim.color ?? '#888'}
							aria-hidden="true"
						></span>
						<div class="flex-1 min-w-0">
							<p class="text-[13px] font-medium text-white truncate">{prim.name}</p>
							{#if prim.description}
								<p class="text-[11px] text-white/50 mt-0.5 line-clamp-2">
									{prim.description}
								</p>
							{/if}
						</div>
					</button>
				{/each}
			{/each}
		{/if}
	</div>
</div>
