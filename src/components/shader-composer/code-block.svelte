<script lang="ts">
	import { Button } from '@/components/ui/button';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { codeToHtml } from 'shiki';

	interface Props {
		code: string;
		language: string;
		alwaysShowCopy?: boolean;
	}

	let { code, language, alwaysShowCopy = false }: Props = $props();

	let copied = $state(false);
	let html = $state('');

	$effect(() => {
		const c = code;
		const lang = language;
		if (!c) {
			html = '';
			return;
		}
		let cancelled = false;
		codeToHtml(c, {
			lang: lang === 'glsl' ? 'glsl' : 'typescript',
			theme: 'night-owl'
		})
			.then((out) => {
				if (!cancelled) html = out;
			})
			.catch(() => {
				if (!cancelled) html = `<pre>${c.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] ?? ch))}</pre>`;
			});
		return () => {
			cancelled = true;
		};
	});

	async function handleCopy() {
		await navigator.clipboard.writeText(code || '');
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

{#if !code}
	<div class="p-4 text-muted-foreground text-sm">No code generated yet</div>
{:else}
	<div class="relative group">
		<Button
			variant="ghost"
			size="sm"
			class={[
				'absolute right-2 top-2 h-8 px-2 z-10 text-xs gap-1.5 bg-white/5 hover:bg-white/10 transition-opacity',
				alwaysShowCopy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
			].join(' ')}
			onclick={handleCopy}
		>
			{#if copied}
				<Check class="h-3.5 w-3.5 text-green-500" />
				<span class="text-green-500">Copied</span>
			{:else}
				<Copy class="h-3.5 w-3.5" />
				<span>Copy</span>
			{/if}
		</Button>
		<div class="shiki-wrap text-xs">
			{@html html}
		</div>
	</div>
{/if}

<style>
	.shiki-wrap :global(pre) {
		padding: 1rem;
		border-radius: 0.5rem;
		overflow: auto;
		background: transparent !important;
	}
</style>
