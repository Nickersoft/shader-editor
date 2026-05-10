<script lang="ts">
	import { composer } from '@/lib/state/composer.svelte';
	import { generate } from '@/lib/codegen';
	import { Button } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import * as Tabs from '@/components/ui/tabs';
	import { ScrollArea } from '@/components/ui/scroll-area';
	import Download from '@lucide/svelte/icons/download';
	import CodeBlock from './code-block.svelte';

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();

	let activeTab = $state('glsl');

	let enabledCount = $derived(composer.chain.enabled.length);

	let generated = $state({ fragmentShader: '', reactComponent: '', vanillaJs: '' });

	// Codegen + Shiki highlighting are expensive — only run while the dialog is
	// open, and debounce so rapid scene mutations don't thrash the main thread.
	$effect(() => {
		if (!open) return;
		void composer.scene;
		if (enabledCount === 0) {
			generated = { fragmentShader: '', reactComponent: '', vanillaJs: '' };
			return;
		}
		const handle = setTimeout(() => {
			generated = generate(composer.chain);
		}, 150);
		return () => clearTimeout(handle);
	});

	function downloadFile(content: string, filename: string) {
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadAll() {
		downloadFile(generated.fragmentShader, 'shader.frag');
		downloadFile(generated.reactComponent, 'Shader.tsx');
		downloadFile(generated.vanillaJs, 'shader.js');
	}

	let activeCode = $derived(
		activeTab === 'glsl'
			? generated.fragmentShader
			: activeTab === 'react'
				? generated.reactComponent
				: generated.vanillaJs,
	);

	let activeLanguage = $derived(activeTab === 'glsl' ? 'glsl' : 'typescript');
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-w-[min(95vw,1100px)] sm:max-w-[min(95vw,1100px)] h-[min(85vh,800px)] p-0 gap-0 flex flex-col overflow-hidden"
	>
		<Dialog.Header class="px-5 py-4 border-b border-[var(--hairline)]">
			<Dialog.Title>Export shader</Dialog.Title>
			<Dialog.Description>
				Copy or download the generated source for your scene.
			</Dialog.Description>
		</Dialog.Header>

		{#if enabledCount === 0}
			<div class="flex-1 flex items-center justify-center text-muted-foreground text-sm">
				Add layers to generate code
			</div>
		{:else}
			<Tabs.Root bind:value={activeTab} class="flex-1 flex flex-col min-h-0">
				<div class="flex items-center justify-between px-5 py-3 border-b border-[var(--hairline)]">
					<Tabs.List class="h-8">
						<Tabs.Trigger value="glsl" class="text-xs h-7 px-3">GLSL</Tabs.Trigger>
						<Tabs.Trigger value="react" class="text-xs h-7 px-3">React</Tabs.Trigger>
						<Tabs.Trigger value="vanilla" class="text-xs h-7 px-3">Vanilla JS</Tabs.Trigger>
					</Tabs.List>
					<Button variant="outline" size="sm" class="h-7 text-xs" onclick={downloadAll}>
						<Download class="h-3 w-3 mr-1" />
						Download All
					</Button>
				</div>

				<ScrollArea class="flex-1 min-h-0 bg-[#011627]">
					<CodeBlock code={activeCode} language={activeLanguage} alwaysShowCopy />
				</ScrollArea>
			</Tabs.Root>
		{/if}
	</Dialog.Content>
</Dialog.Root>
