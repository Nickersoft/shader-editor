<script lang="ts">
	import { Slider } from '@/components/ui/slider';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import type { ImageInputValue } from '@/shaders/core/schemas';

	interface Props {
		value: ImageInputValue;
		onChange: (value: ImageInputValue) => void;
	}

	let { value, onChange }: Props = $props();

	let fileEl = $state<HTMLInputElement | null>(null);
	let error = $state<string | null>(null);

	function handleFile(file: File) {
		error = null;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				onChange({ ...value, url: reader.result, sourceKind: 'dataUrl' });
			}
		};
		reader.onerror = () => (error = 'Failed to read file');
		reader.readAsDataURL(file);
	}

	function handlePaste(url: string) {
		if (!url) return;
		error = null;
		onChange({ ...value, url, sourceKind: 'url' });
	}
</script>

<div class="space-y-2">
	<div
		class="flex items-center gap-2 p-2 rounded border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50"
		role="button"
		tabindex="0"
		onclick={() => fileEl?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') fileEl?.click();
		}}
		ondragover={(e) => e.preventDefault()}
		ondrop={(e) => {
			e.preventDefault();
			const f = e.dataTransfer?.files[0];
			if (f) handleFile(f);
		}}
	>
		{#if value.url}
			<img src={value.url} alt="Preview" class="w-12 h-12 object-cover rounded" />
		{:else}
			<div class="w-12 h-12 rounded bg-muted/60 flex items-center justify-center text-muted-foreground">
				<Upload class="h-4 w-4" />
			</div>
		{/if}
		<div class="flex-1 min-w-0">
			<div class="text-[11px] text-muted-foreground truncate">
				{value.url ? (value.sourceKind === 'dataUrl' ? 'Uploaded file' : value.url) : 'Drop or paste an image'}
			</div>
			{#if error}
				<div class="text-[10px] text-destructive truncate">{error}</div>
			{/if}
		</div>
		{#if value.url}
			<button
				onclick={(e) => {
					e.stopPropagation();
					onChange({ ...value, url: null, sourceKind: 'url' });
				}}
				class="text-muted-foreground hover:text-destructive p-1"
				aria-label="Clear image"
			>
				<X class="h-3 w-3" />
			</button>
		{/if}
	</div>
	<input
		bind:this={fileEl}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={(e) => {
			const f = (e.currentTarget as HTMLInputElement).files?.[0];
			if (f) handleFile(f);
			(e.currentTarget as HTMLInputElement).value = '';
		}}
	/>
	<input
		type="text"
		placeholder="…or paste a URL"
		class="w-full h-7 text-[11px] px-2 rounded border border-border bg-background"
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				const target = e.currentTarget as HTMLInputElement;
				handlePaste(target.value);
				target.value = '';
			}
		}}
	/>
	<div class="grid grid-cols-2 gap-2">
		<label class="text-[10px] text-muted-foreground">
			Fit
			<select
				class="w-full h-6 mt-0.5 text-[11px] bg-background border border-border rounded px-1"
				value={value.fit ?? 'cover'}
				onchange={(e) =>
					onChange({
						...value,
						fit: (e.currentTarget as HTMLSelectElement).value as ImageInputValue['fit']
					})}
			>
				<option value="cover">Cover</option>
				<option value="contain">Contain</option>
				<option value="fill">Fill</option>
			</select>
		</label>
		<label class="text-[10px] text-muted-foreground">
			Scale
			<Slider
				type="single"
				value={value.scale ?? 1}
				onValueChange={(s) => onChange({ ...value, scale: s as number })}
				min={0.1}
				max={4}
				step={0.01}
				class="mt-2"
			/>
		</label>
	</div>
</div>
