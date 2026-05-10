<script lang="ts">
	import LayerStack from './layer-stack.svelte';
	import ShaderPreview from './shader-preview.svelte';
	import PropertyPanel from './property-panel.svelte';
	import CanvasToolbar from './canvas-toolbar.svelte';
	import EffectsPalette from './effects-palette.svelte';
	import ExportDialog from './export-dialog.svelte';

	let paletteCategory = $state<string | null>(null);
	let exportOpen = $state(false);
</script>

<div class="h-screen w-screen bg-neutral-900 overflow-hidden">
	<div class="flex flex-col h-full w-full px-4 pb-4 overflow-hidden">
		<header class="flex h-[69px] items-center justify-between pl-4 pr-3 py-3 shrink-0">
			<h1
				class="text-[16px] font-medium tracking-[-0.32px] bg-clip-text text-transparent"
				style="background-image: linear-gradient(to bottom, #ffffff, rgba(255,255,255,0.8));"
			>
				Shader Studio
			</h1>
			<button
				type="button"
				onclick={() => (exportOpen = true)}
				class="relative h-9 inline-flex items-center gap-2 px-3 py-3 rounded-lg text-[14px] font-medium text-white border-[0.5px] border-[rgba(255,255,255,0.1)] overflow-hidden cursor-pointer hover:brightness-110 transition"
				style="background-image: linear-gradient(to top, var(--indigo-700), var(--indigo-600));"
			>
				<span class="relative">Export</span>
				<span
					class="pointer-events-none absolute inset-0 rounded-[inherit]"
					style="box-shadow: inset 0 0.5px 1px 0 rgba(255,255,255,0.2);"
				></span>
			</button>
		</header>

		<div class="flex-1 grid grid-cols-[300px_minmax(0,1fr)_300px] gap-4 min-h-0">
			<aside class="glass-panel rounded-3xl overflow-hidden min-h-0">
				<LayerStack />
			</aside>

			<main class="relative p-2 min-h-0">
				<div class="absolute inset-2 rounded-3xl overflow-hidden">
					<ShaderPreview />
				</div>

				{#if paletteCategory}
					<EffectsPalette
						category={paletteCategory}
						onClose={() => (paletteCategory = null)}
					/>
				{/if}

				<CanvasToolbar
					selected={paletteCategory}
					onSelect={(c) => (paletteCategory = paletteCategory === c ? null : c)}
				/>
			</main>

			<aside class="glass-panel rounded-3xl overflow-hidden min-h-0">
				<PropertyPanel />
			</aside>
		</div>
	</div>

	<ExportDialog bind:open={exportOpen} />
</div>
