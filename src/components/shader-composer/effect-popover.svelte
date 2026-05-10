<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import { composer } from '@/lib/state/composer.svelte';
	import {
		inspectObjectSchema,
		inspectUiFields,
		type InspectedField,
		type InspectedUiField
	} from '@/lib/codegen/schema-introspection';
	import { getMetaDeep } from '@/shaders/core/schemas';
	import type { EffectNode } from '@/shaders/core/node.svelte';
	import { ScrollArea } from '@/components/ui/scroll-area';
	import FieldControl from './field-control.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		effect: EffectNode;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		// Snippet receives the bits-ui trigger props bag — spread it onto your
		// own element. Lets the trigger be a <div> with nested buttons (toggle,
		// trash) without producing nested-<button> invalid HTML.
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
	}

	let { effect, open, onOpenChange, trigger }: Props = $props();

	let cls = $derived(effect.cls);
	let cfgFields = $derived(inspectUiFields(cls.config));
	let inFields = $derived(inspectObjectSchema(cls.inputs));

	// Same visibleWhen filter the main property panel uses, so popovers respect
	// conditional fields (e.g. Halftone style branches) without diverging.
	let visibleCfgFields = $derived.by(() => {
		const config = effect.config;
		return cfgFields.filter((field) => {
			const cond = getMetaDeep(field.schema)?.ui?.visibleWhen;
			if (!cond) return true;
			for (const [siblingKey, allowed] of Object.entries(cond)) {
				const v = config[siblingKey];
				if (!allowed.some((a) => a === v)) return false;
			}
			return true;
		});
	});

	function fieldLabel(field: InspectedField | InspectedUiField): string {
		return field.schema.description ?? field.key;
	}
</script>

<PopoverPrimitive.Root {open} {onOpenChange}>
	<PopoverPrimitive.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</PopoverPrimitive.Trigger>
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			side="left"
			align="start"
			sideOffset={12}
			class="glass-floating rounded-2xl w-[280px] max-h-[60vh] flex flex-col z-50 overflow-hidden outline-none"
		>
			<div
				class="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.1)] shrink-0"
			>
				<span
					class="size-3 rounded-[3px] shrink-0"
					style:background-color={effect.meta.color}
					aria-hidden="true"
				></span>
				<p class="text-[13px] font-medium text-white truncate flex-1">
					{effect.meta.name}
				</p>
			</div>
			<ScrollArea class="flex-1 min-h-0">
				<div class="px-3 py-3 space-y-4">
					{#if visibleCfgFields.length + inFields.length === 0}
						<p class="px-1 text-[12px] text-white/50">No tweakable parameters.</p>
					{:else}
						{#each visibleCfgFields as field (field.key)}
							{@const value = effect.config[field.key]}
							<FieldControl
								{field}
								label={fieldLabel(field)}
								{value}
								onChange={(v) => composer.updateConfig(effect.id, field.key, v)}
							/>
						{/each}
						{#each inFields as field (field.key)}
							{@const value = effect.inputs[field.key]}
							<FieldControl
								{field}
								label={fieldLabel(field)}
								{value}
								onChange={(v) => composer.updateInput(effect.id, field.key, v)}
							/>
						{/each}
					{/if}
				</div>
			</ScrollArea>
		</PopoverPrimitive.Content>
	</PopoverPrimitive.Portal>
</PopoverPrimitive.Root>
