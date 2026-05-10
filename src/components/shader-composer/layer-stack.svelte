<script lang="ts">
	import '@/shaders';
	import { DragDropProvider, PointerSensor, KeyboardSensor } from '@dnd-kit/svelte';
	import { PointerActivationConstraints } from '@dnd-kit/dom';
	import { composer } from '@/lib/state/composer.svelte';
	import { ScrollArea } from '@/components/ui/scroll-area';
	import SceneHeader from './scene-header.svelte';
	import SortableLayerWithEffects from './sortable-layer-with-effects.svelte';
	import SortableEffectRow from './sortable-effect-row.svelte';

	// Default PointerSensor activates a drag immediately on pointerdown when the
	// target is a drag handle (mouse only) — that swallows the click event so
	// `onclick` never fires on the row label. Require a 5px move first so a
	// stationary click selects the row instead of starting a drag.
	const sensors = [
		PointerSensor.configure({
			activationConstraints(event) {
				if (event.pointerType === 'touch') {
					return [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })];
				}
				return [new PointerActivationConstraints.Distance({ value: 5 })];
			}
		}),
		KeyboardSensor
	];

	let sceneOpen = $state(true);
	let expandedLayers = $state<Record<string, boolean>>({});

	function toggleLayerExpanded(id: string) {
		expandedLayers = {
			...expandedLayers,
			[id]: !(expandedLayers[id] ?? true)
		};
	}

	let displayLayers = $derived([...composer.scene.layers].reverse());
	let displayPostEffects = $derived([...composer.scene.postEffects].reverse());

	function arrayMove<T>(arr: T[], from: number, to: number): T[] {
		const next = arr.slice();
		const [it] = next.splice(from, 1);
		next.splice(to, 0, it);
		return next;
	}

	type EffectLoc = { container: 'scene' | string; effectId: string };

	function parseEffectId(id: string): EffectLoc | null {
		if (!id.startsWith('effect:')) return null;
		const parts = id.split(':');
		if (parts[1] === 'scene') return { container: 'scene', effectId: parts[2] };
		if (parts[1] === 'layer') return { container: parts[2], effectId: parts[3] };
		return null;
	}

	function effectDisplayIndex(loc: EffectLoc): number {
		if (loc.container === 'scene') {
			return displayPostEffects.findIndex((e) => e.id === loc.effectId);
		}
		const layer = composer.scene.findLayer(loc.container);
		if (!layer) return -1;
		return [...layer.effects].reverse().findIndex((e) => e.id === loc.effectId);
	}

	function displayToStorageIndex(container: 'scene' | string, displayIndex: number): number {
		const list =
			container === 'scene'
				? composer.scene.postEffects
				: composer.scene.findLayer(container)?.effects;
		if (!list) return 0;
		return Math.max(0, list.length - displayIndex);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleDragEnd(event: any) {
		if (event.canceled) return;
		const op = event.operation;
		const sourceId = op.source?.id as string | undefined;
		const targetId = op.target?.id as string | undefined;
		if (!sourceId || !targetId || sourceId === targetId) return;

		if (sourceId.startsWith('layer:') && targetId.startsWith('layer:')) {
			const oldIndex = displayLayers.findIndex((l) => `layer:${l.id}` === sourceId);
			const newIndex = displayLayers.findIndex((l) => `layer:${l.id}` === targetId);
			if (oldIndex < 0 || newIndex < 0) return;
			const next = arrayMove(displayLayers, oldIndex, newIndex);
			composer.reorderLayers(next.slice().reverse().map((l) => l.id));
			return;
		}

		const src = parseEffectId(sourceId);
		if (!src) return;

		if (targetId === 'scene-root') {
			if (src.container === 'scene') return;
			composer.moveEffect(
				src.effectId,
				src.container,
				null,
				composer.scene.postEffects.length
			);
			return;
		}

		if (targetId.startsWith('layer:')) {
			const targetLayerId = targetId.slice('layer:'.length);
			if (src.container === targetLayerId) return;
			const fromLayerId = src.container === 'scene' ? null : src.container;
			composer.moveEffect(
				src.effectId,
				fromLayerId,
				targetLayerId,
				composer.scene.findLayer(targetLayerId)?.effects.length ?? 0
			);
			return;
		}

		const dst = parseEffectId(targetId);
		if (!dst) return;
		const dstDisplayIndex = effectDisplayIndex(dst);
		if (dstDisplayIndex < 0) return;

		if (src.container === dst.container) {
			const srcDisplayIndex = effectDisplayIndex(src);
			if (srcDisplayIndex < 0) return;
			if (src.container === 'scene') {
				const next = arrayMove(displayPostEffects, srcDisplayIndex, dstDisplayIndex);
				composer.reorderSceneEffects(next.slice().reverse().map((e) => e.id));
			} else {
				const layer = composer.scene.findLayer(src.container);
				if (!layer) return;
				const display = [...layer.effects].reverse();
				const next = arrayMove(display, srcDisplayIndex, dstDisplayIndex);
				composer.reorderEffectsInLayer(
					src.container,
					next.slice().reverse().map((e) => e.id)
				);
			}
			return;
		}

		const fromLayerId = src.container === 'scene' ? null : src.container;
		const toLayerId = dst.container === 'scene' ? null : dst.container;
		const storageIndex = displayToStorageIndex(dst.container, dstDisplayIndex);
		composer.moveEffect(src.effectId, fromLayerId, toLayerId, storageIndex);
	}
</script>

<DragDropProvider {sensors} onDragEnd={handleDragEnd}>
	<div class="flex flex-col h-full min-h-0 px-3 py-3">
		<SceneHeader open={sceneOpen} onToggle={() => (sceneOpen = !sceneOpen)} />

		{#if sceneOpen}
			<ScrollArea class="flex-1 min-h-0 mt-2">
				<div class="space-y-1">
					{#each displayPostEffects as fx, i (fx.id)}
						<SortableEffectRow
							effectId={fx.id}
							index={i}
							layerId={null}
							scope="scene"
							depth={1}
						/>
					{/each}

					{#if displayLayers.length === 0 && displayPostEffects.length === 0}
						<div class="text-center py-6 text-white/40 text-xs px-3">
							Use the toolbar below to add a shape or texture.
						</div>
					{:else}
						{#each displayLayers as layer, i (layer.id)}
							<SortableLayerWithEffects
								{layer}
								layerIndex={i}
								isExpanded={expandedLayers[layer.id] ?? true}
								onToggleExpanded={() => toggleLayerExpanded(layer.id)}
								{expandedLayers}
								onToggleChildExpanded={toggleLayerExpanded}
							/>
						{/each}
					{/if}
				</div>
			</ScrollArea>
		{/if}
	</div>
</DragDropProvider>
