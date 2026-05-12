<script lang="ts">
	import { composer } from '@/lib/state/composer.svelte';
	import { listNodeClasses } from '@/shaders/core/registry';
	import {
		GeneratorNode,
		EffectNode,
		generatorSourceKind,
		getEffectAppliesTo,
		getEffectScope,
		type NodeClass
	} from '@/shaders/core/node.svelte';
	import { isFieldStageNodeClass } from '@/shaders/core/node.svelte';
	import { ProceduralField } from '@/shaders/textures/procedural-field.svelte';
	import type { Category } from '@/shaders/core/types';
	import { PROCEDURAL_PRESETS, type ProceduralPreset } from '@/shaders/textures/procedural-presets';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		category: string;
		onClose: () => void;
	}

	let { category, onClose }: Props = $props();

	// Tile model: a node class, a ProceduralField preset facade, or a stage
	// class destined for the active FieldGroup. All render identically (color
	// chip + label); the click handler picks the right composer method.
	type Tile =
		| { kind: 'class'; cls: NodeClass; key: string; name: string; description: string; color: string }
		| { kind: 'preset'; preset: ProceduralPreset; key: string; name: string; description: string; color: string }
		| { kind: 'stage'; cls: NodeClass; key: string; name: string; description: string; color: string };

	const TITLES: Record<string, string> = {
		shapes: 'Shapes',
		effects: 'Effects',
		textures: 'Textures',
		adjustments: 'Adjustments',
		'field-stages': 'Stages'
	};

	const CATEGORIES: Record<string, Category[]> = {
		shapes: ['shapes'],
		textures: ['textures'],
		effects: ['shape-effects', 'stylize', 'distortion', 'blurs', 'interactive'],
		adjustments: ['adjustments'],
		'field-stages': ['field-stages']
	};

	function isGeneratorClass(cls: NodeClass): boolean {
		return (cls as unknown as typeof GeneratorNode).prototype instanceof GeneratorNode;
	}
	function isEffectClass(cls: NodeClass): boolean {
		return (cls as unknown as typeof EffectNode).prototype instanceof EffectNode;
	}

	// Active FieldGroup — the ProceduralField that owns the current selection,
	// if any. Drives the field-stages picker: stages are appended to this group.
	let activeFieldGroup = $derived.by<ProceduralField | null>(() => {
		const found = composer.selectedNodeId
			? composer.scene.findNode(composer.selectedNodeId)
			: null;
		if (!found?.layer) return null;
		return found.layer.source instanceof ProceduralField ? found.layer.source : null;
	});

	// When a layer is selected, narrow the picker to effects that may apply to
	// that layer's source kind (e.g. exclude Glass when a texture is selected).
	// Generators are unaffected — they create new layers regardless of context.
	let activeLayer = $derived.by(() => {
		if (!composer.selectedNodeId) return null;
		return composer.scene.findNode(composer.selectedNodeId)?.layer ?? null;
	});
	let activeSourceKind = $derived(
		activeLayer ? generatorSourceKind(activeLayer.source.cls) : 'any'
	);

	let items = $derived.by<Tile[]>(() => {
		const cats = new Set(CATEGORIES[category] ?? []);

		// Stage palette is its own world — only show registered stage classes.
		if (category === 'field-stages') {
			return listNodeClasses()
				.filter((cls) => cls.meta.category === 'field-stages')
				.map((cls) => ({
					kind: 'stage' as const,
					cls,
					key: `stage:${cls.typeId}`,
					name: cls.meta.name,
					description: cls.meta.description,
					color: cls.meta.color
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
		}

		const classTiles: Tile[] = listNodeClasses()
			.filter((cls) => {
				// Never show stage classes outside the field-stages palette —
				// they aren't standalone.
				if (isFieldStageNodeClass(cls)) return false;
				if (!cats.has(cls.meta.category)) return false;
				// Hide the bare ProceduralField — the preset tiles below stand in
				// for it. Once Separated, the layer's identity is still the same
				// class; this only affects what the user sees in the picker.
				if (cls.typeId === 'procedural-field') return false;
				if (isEffectClass(cls)) {
					const allowed = getEffectAppliesTo(cls);
					if (
						activeSourceKind !== 'any' &&
						!allowed.includes('any') &&
						!allowed.includes(activeSourceKind)
					) {
						return false;
					}
				}
				return true;
			})
			.map((cls) => ({
				kind: 'class' as const,
				cls,
				key: `class:${cls.typeId}`,
				name: cls.meta.name,
				description: cls.meta.description,
				color: cls.meta.color
			}));

		// ProceduralField presets surface only in the textures palette since the
		// container's meta.category is 'textures'.
		const presetTiles: Tile[] = cats.has('textures')
			? PROCEDURAL_PRESETS.map((preset) => ({
					kind: 'preset' as const,
					preset,
					key: `preset:${preset.id}`,
					name: preset.name,
					description: preset.description,
					color: preset.color
				}))
			: [];

		return [...classTiles, ...presetTiles].sort((a, b) => a.name.localeCompare(b.name));
	});

	function handlePick(tile: Tile) {
		if (tile.kind === 'preset') {
			composer.addProceduralPresetLayer(tile.preset.id);
			onClose();
			return;
		}
		if (tile.kind === 'stage') {
			// Stages append to the active FieldGroup, or no-op if none active.
			const group = activeFieldGroup;
			if (group) {
				const found = composer.scene.findNode(group.id);
				const layer = found?.layer;
				if (layer) composer.addStageToFieldGroup(layer.id, tile.cls.typeId);
			}
			onClose();
			return;
		}
		const cls = tile.cls;
		const typeId = cls.typeId;
		if (isGeneratorClass(cls)) {
			composer.addLayer(typeId);
		} else if (isEffectClass(cls)) {
			const scope = getEffectScope(cls);
			if (scope === 'layer') {
				const sel = composer.selectedNodeId
					? composer.scene.findNode(composer.selectedNodeId)?.layer
					: null;
				const target = sel ?? composer.scene.layers[composer.scene.layers.length - 1];
				if (target) composer.addEffectToLayer(target.id, typeId);
				else composer.addSceneEffect(typeId);
			} else {
				composer.addSceneEffect(typeId);
			}
		}
		onClose();
	}
</script>

<div
	class="absolute bottom-[88px] left-1/2 -translate-x-1/2 glass-floating rounded-3xl w-[464px] max-h-[60%] flex flex-col z-10 overflow-hidden"
>
	<div class="flex items-center justify-between px-6 py-4 shrink-0">
		<p class="text-[16px] font-medium text-white tracking-[-0.32px]">
			{TITLES[category] ?? category}
		</p>
		<button
			class="p-1 text-white/60 hover:text-white"
			onclick={onClose}
			aria-label="Close palette"
		>
			<X class="size-4" />
		</button>
	</div>

	<div class="grid grid-cols-4 gap-x-6 gap-y-4 px-4 pb-4 overflow-y-auto">
		{#each items as tile (tile.key)}
			<button
				class="flex flex-col items-center gap-2 group/tile"
				onclick={() => handlePick(tile)}
				title={tile.description}
			>
				<div
					class="w-full h-[75px] rounded-xl bg-[rgba(255,255,255,0.05)] group-hover/tile:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center justify-center"
				>
					<span
						class="size-6 rounded-md"
						style:background-color={tile.color}
						aria-hidden="true"
					></span>
				</div>
				<p
					class="text-[12px] font-medium text-white/90 group-hover/tile:text-white truncate w-full text-center"
				>
					{tile.name}
				</p>
			</button>
		{/each}
		{#if items.length === 0}
			<div class="col-span-4 text-center text-white/50 text-xs py-6">
				{#if category === 'field-stages'}
					Select a Procedural Field layer first.
				{:else}
					No primitives in this category yet.
				{/if}
			</div>
		{/if}
	</div>
</div>
