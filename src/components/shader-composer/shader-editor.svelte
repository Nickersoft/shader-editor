<script lang="ts">
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import LayerStack from "./layer-stack.svelte";
    import ShaderPreview from "./shader-preview.svelte";
    import PropertyPanel from "./property-panel.svelte";
    import CanvasToolbar from "./canvas-toolbar.svelte";
    import EffectsPalette from "./effects-palette.svelte";
    import ExportDialog from "./export-dialog.svelte";
    import TextureGraphEditor from "./texture-graph/texture-graph-editor.svelte";
    import Card from "../ui/card/card.svelte";
    import { composer } from "@/lib/state/composer.svelte";

    let paletteCategory = $state<string | null>(null);
    let exportOpen = $state(false);
</script>

<div class="h-screen w-screen overflow-hidden flex flex-col">
    <div class="flex flex-col w-full px-4 pb-4 overflow-hidden flex-1 min-h-0">
        <header
            class="flex h-[69px] items-center justify-between pl-4 pr-3 py-3 shrink-0"
        >
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

        <div
            class="flex-1 grid grid-cols-[300px_minmax(0,1fr)_300px] gap-4 min-h-0"
        >
            <Card>
                <LayerStack />
            </Card>

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
                    onSelect={(c) =>
                        (paletteCategory = paletteCategory === c ? null : c)}
                />
            </main>

            <Card class="overflow-hidden min-h-0">
                <PropertyPanel />
            </Card>
        </div>
    </div>

    {#if composer.editingTextureLayerId}
        <div
            class="h-[55vh] shrink-0 border-t border-white/10 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.6)]"
            transition:fly={{ y: 600, duration: 280, easing: cubicOut }}
        >
            <TextureGraphEditor />
        </div>
    {/if}

    <ExportDialog bind:open={exportOpen} />
</div>
