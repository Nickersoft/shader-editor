<script lang="ts">
	import { composer } from '@/lib/state/composer.svelte';
	import type { InspectedField } from '@/lib/codegen/schema-introspection';
	import type { Shader } from '@/shaders/core/shader.svelte';
	import FieldControl from './field-control.svelte';

	interface Props {
		node: Shader;
		field: InspectedField;
		label?: string;
	}

	let { node, field, label }: Props = $props();

	let value = $derived((node.inputs as Record<string, unknown>)[field.key]);
	let resolvedLabel = $derived(label ?? field.schema.description ?? field.key);

	function handleChange(v: unknown) {
		composer.updateInput(node.id, field.key, v);
	}
</script>

<FieldControl {field} label={resolvedLabel} {value} onChange={handleChange} />
