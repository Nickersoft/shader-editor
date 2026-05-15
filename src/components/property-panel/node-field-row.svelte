<script lang="ts">
	import { composer } from '@/lib/state/composer.svelte';
	import type {
		InspectedField,
		InspectedUiField
	} from '@/lib/codegen/schema-introspection';
	import type { Node } from '@/shaders/core/node.svelte';
	import FieldControl from './field-control.svelte';

	interface Props {
		node: Node;
		field: InspectedField | InspectedUiField;
		kind: 'config' | 'uniform';
		label?: string;
	}

	let { node, field, kind, label }: Props = $props();

	let value = $derived(
		kind === 'config' ? node.config[field.key] : node.uniforms[field.key]
	);
	let resolvedLabel = $derived(label ?? field.schema.description ?? field.key);

	function handleChange(v: unknown) {
		if (kind === 'config') composer.updateConfig(node.id, field.key, v);
		else composer.updateUniform(node.id, field.key, v);
	}
</script>

<FieldControl {field} label={resolvedLabel} {value} onChange={handleChange} />
