<script lang="ts">
	import '@/shaders';
	import { DragDropProvider, PointerSensor, KeyboardSensor } from '@dnd-kit/svelte';
	import { PointerActivationConstraints } from '@dnd-kit/dom';
	import { composer } from '@/lib/state/composer.svelte';
	import { dragIntent } from '@/lib/state/drag-intent.svelte';
	import { ScrollArea } from '@/components/ui/scroll-area';
	import SceneHeader from './scene-header.svelte';
	import SortableLayerWithEffects from './sortable-layer-with-effects.svelte';

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleDragOver(event: any) {
		const op = event.operation;
		const sourceId = op.source?.id as string | undefined;
		const targetId = op.target?.id as string | undefined;
		if (!sourceId?.startsWith('layer:') || !targetId?.startsWith('layer:')) return;
		dragIntent.set(targetId.slice('layer:'.length));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleDragEnd(event: any) {
		dragIntent.reset();
		if (event.canceled) return;
		const op = event.operation;
		const sourceId = op.source?.id as string | undefined;
		const targetId = op.target?.id as string | undefined;
		if (!sourceId || !targetId || sourceId === targetId) return;

		if (sourceId.startsWith('layer:') && targetId.startsWith('layer:')) {
			composer.nestLayerAsChild(
				sourceId.slice('layer:'.length),
				targetId.slice('layer:'.length)
			);
		}
	}
</script>

<DragDropProvider {sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
	<div class="flex flex-col h-full min-h-0 px-3 py-3">
		<SceneHeader
			open={sceneOpen}
			selected={composer.isSceneSelected}
			onToggle={() => (sceneOpen = !sceneOpen)}
			onSelect={() => composer.selectScene()}
		/>

		{#if sceneOpen}
			<ScrollArea class="flex-1 min-h-0 mt-2">
				<div class="space-y-1">
					{#if displayLayers.length === 0}
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
