<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
	import {
		defaultForPinType,
		getPrimitive,
		type PinDefault,
		type PinSpec,
	} from '@/shaders/node-graph';
	import { categoryColorFor, colorForPin } from './pin-color';
	import PinEditor from './pin-editor.svelte';
	import { inspectUiFields, type InspectedUiField } from '@/lib/codegen/schema-introspection';
	import { composer } from '@/lib/state/composer.svelte';
	import { NumberInput } from '@/components/ui/number-input';
	import * as Select from '@/components/ui/select';

	type PrimitiveNodeData = {
		nodeId: string;
		typeId: string;
		config: Record<string, unknown>;
		pinValues?: Record<string, PinDefault>;
		wiredInputIds: Set<string>;
	};

	type PrimitiveGraphNodeType = Node<PrimitiveNodeData, 'primitive'>;

	let { data, selected }: NodeProps<PrimitiveGraphNodeType> = $props();

	// Fixed row geometry. Pin rows align 1:1 with handle pixel offsets so the
	// dot sits exactly on the row's text baseline — like Blender. Unwired
	// input pins host an inline editor (NumberInput / VecScrubber /
	// ColorSwatch) and need a taller row.
	const HEADER_H = 34;
	const PIN_ROW_H = 24;
	const INLINE_PIN_ROW_H = 32;
	const CONFIG_ROW_H = 32;

	let prim = $derived(getPrimitive(data.typeId));
	let inputs = $derived((prim?.inputs(data.config) ?? []) as readonly PinSpec[]);
	let outputs = $derived((prim?.outputs(data.config) ?? []) as readonly PinSpec[]);

	// Inline config — only field types that fit a 220px-wide node row render
	// here. Complex shapes (palettes, vec colors, images, the GroupInput pin
	// editor) stay in the dedicated property panel.
	let allConfigFields = $derived.by<InspectedUiField[]>(() => {
		if (!prim?.config) return [];
		return inspectUiFields(prim.config).filter((f) => {
			if (f.glslType === 'float' || f.glslType === 'int' || f.glslType === 'bool') return true;
			if (f.glslType === 'enumString') return true;
			return false;
		});
	});

	let displayTitle = $derived(prim?.displayTitle(data.config) ?? data.typeId);
	let glyph = $derived(prim?.glyph(data.config));
	let isGroup = $derived(data.typeId === 'group');

	// Group nodes accept a double-click to descend into their subgraph; the
	// composer's edit stack tracks the path. xyflow doesn't expose an
	// `onnodedoubleclick`, so the handler lives on the node body directly.
	function handleDoubleClick(e: MouseEvent) {
		if (!isGroup) return;
		e.stopPropagation();
		composer.enterGraphGroup(data.nodeId);
	}

	let configFields = $derived(allConfigFields);

	// Pixel offset of each pin's handle, measured from the node's top edge.
	// Outputs sit immediately under the header; inputs sit under the config
	// block. Input rows have variable height depending on whether they host
	// an inline editor, so offsets are computed cumulatively.
	let outputOffsets = $derived(
		outputs.map((_, i) => HEADER_H + i * PIN_ROW_H + PIN_ROW_H / 2),
	);
	let inputBase = $derived(
		HEADER_H + outputs.length * PIN_ROW_H + configFields.length * CONFIG_ROW_H,
	);
	let inputRowHeights = $derived(
		inputs.map((pin) =>
			data.wiredInputIds.has(pin.id) ? PIN_ROW_H : INLINE_PIN_ROW_H,
		),
	);
	let inputOffsets = $derived.by(() => {
		const out: number[] = [];
		let off = inputBase;
		for (const h of inputRowHeights) {
			out.push(off + h / 2);
			off += h;
		}
		return out;
	});

	let categoryColor = $derived(categoryColorFor(prim?.category, prim?.color ?? '#888'));
	let categoryLabel = $derived(prim?.category ?? '');

	function setConfig(key: string, value: unknown) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		composer.setGraphNodeConfig(layerId, data.nodeId, key, value);
	}

	// Inline-editor draft state. The user's in-flight value lives here so the
	// NumberInput / VecScrubber / ColorSwatch can show it live, while the
	// composer (and therefore the GLSL fingerprint) is only updated on
	// commit — drag-end, Enter/blur, arrow-key step, or picker close. Keeps
	// constant-folding intact during the steady state and limits shader
	// rebuilds to one per commit instead of one per drag pixel.
	let drafts = $state<Record<string, PinDefault>>({});

	function commitPin(pinId: string, value: PinDefault) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		composer.setGraphNodePinValue(layerId, data.nodeId, pinId, value);
		delete drafts[pinId];
	}

	function draftPin(pinId: string, value: PinDefault) {
		drafts[pinId] = value;
	}

	function pinValueOf(pin: PinSpec): PinDefault | undefined {
		return drafts[pin.id] ?? data.pinValues?.[pin.id] ?? pin.default;
	}

	function configLabel(field: InspectedUiField): string {
		return field.schema.description ?? field.key;
	}

	function titleCase(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
</script>

<div
	class="rounded-xl bg-neutral-800 border transition-colors w-[220px] overflow-hidden {selected
		? 'border-indigo-400 shadow-[0_0_0_1px_var(--color-indigo-400)]'
		: 'border-white/10'}"
	role={isGroup ? 'button' : undefined}
	tabindex={isGroup ? 0 : undefined}
	ondblclick={handleDoubleClick}
>
	<div
		class="flex items-stretch border-b border-white/10"
		style:height="{HEADER_H}px"
		style:background-color="color-mix(in srgb, {categoryColor} 18%, transparent)"
	>
		{#if glyph}
			<div
				class="flex items-center justify-center shrink-0 text-[14px] font-semibold text-white px-2 border-r border-white/10"
				style:min-width="34px"
				style:background-color="color-mix(in srgb, {categoryColor} 32%, transparent)"
				style:color={categoryColor}
				aria-hidden="true"
			>
				{glyph}
			</div>
		{:else}
			<span
				class="self-center ml-3 size-2.5 rounded-[3px] shrink-0"
				style:background-color={categoryColor}
				aria-hidden="true"
			></span>
		{/if}
		<p class="flex-1 min-w-0 self-center pl-2 text-[13px] font-medium text-white truncate">
			{displayTitle}
		</p>
		{#if categoryLabel}
			<span
				class="self-center mr-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide rounded-[3px] text-white/60"
				style:background-color="color-mix(in srgb, {categoryColor} 22%, transparent)"
			>
				{categoryLabel}
			</span>
		{/if}
	</div>

	{#each outputs as pin (pin.id)}
		<div
			class="flex items-center justify-end pr-4 text-[11px] text-white/70"
			style:height="{PIN_ROW_H}px"
		>
			<span class="truncate">{pin.label ?? pin.id}</span>
		</div>
	{/each}

	{#each configFields as field (field.key)}
		{@const value = data.config[field.key]}
		<div
			class="px-2 flex items-center nodrag"
			style:height="{CONFIG_ROW_H}px"
		>
			{#if field.glslType === 'float'}
				<NumberInput
					class="w-full"
					label={configLabel(field)}
					value={(value as number) ?? 0}
					onChange={(v) => setConfig(field.key, v)}
					step={0.01}
				/>
			{:else if field.glslType === 'int'}
				<NumberInput
					class="w-full"
					label={configLabel(field)}
					value={(value as number) ?? 0}
					onChange={(v) => setConfig(field.key, v)}
					step={1}
					integer
				/>
			{:else if field.glslType === 'bool'}
				<label class="flex items-center gap-2 w-full text-[11px] text-white/70">
					<input
						type="checkbox"
						class="accent-indigo-400"
						checked={Boolean(value)}
						onchange={(e) =>
							setConfig(field.key, (e.currentTarget as HTMLInputElement).checked)}
					/>
					<span class="truncate">{configLabel(field)}</span>
				</label>
			{:else if field.glslType === 'enumString'}
				{@const opts = field.enumValues ?? []}
				{@const current = (value as string | undefined) ?? opts[0] ?? ''}
				{@const labelFor = (opt: string) => field.enumLabels?.[opt] ?? titleCase(opt)}
				<Select.Root
					type="single"
					value={current}
					onValueChange={(v) => setConfig(field.key, v)}
				>
					<Select.Trigger
						class="w-full h-7 text-[11px] bg-[rgba(255,255,255,0.04)] border-0 text-white px-2"
					>
						{labelFor(current)}
					</Select.Trigger>
					<Select.Content>
						{#each opts as opt (opt)}
							<Select.Item value={opt}>{labelFor(opt)}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
	{/each}

	{#each inputs as pin, i (pin.id)}
		{@const wired = data.wiredInputIds.has(pin.id)}
		{@const val = pinValueOf(pin) ?? defaultForPinType(pin.type)}
		<div
			class="flex items-center pl-4 pr-2 gap-2 text-[11px] text-white/70 nodrag"
			style:height="{inputRowHeights[i]}px"
		>
			{#if wired}
				<span class="truncate">{pin.label ?? pin.id}</span>
			{:else}
				<span class="truncate shrink-0 max-w-[64px]">{pin.label ?? pin.id}</span>
				<PinEditor
					{pin}
					value={val}
					onDraft={(v) => draftPin(pin.id, v)}
					onCommit={(v) => commitPin(pin.id, v)}
				/>
			{/if}
		</div>
	{/each}
</div>

{#each outputs as pin, i (pin.id)}
	<Handle
		id={pin.id}
		type="source"
		position={Position.Right}
		style="top: {outputOffsets[i]}px; background: {colorForPin(pin)};"
		title="{pin.label ?? pin.id} · {pin.type}"
		isConnectableStart
		isConnectableEnd={false}
	/>
{/each}
{#each inputs as pin, i (pin.id)}
	<Handle
		id={pin.id}
		type="target"
		position={Position.Left}
		style="top: {inputOffsets[i]}px; background: {colorForPin(pin)};"
		title="{pin.label ?? pin.id} · {pin.type}"
		isConnectableEnd
		isConnectableStart={false}
	/>
{/each}
