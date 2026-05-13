<script lang="ts">
	import { useSvelteFlow, type Node as XYNode } from '@xyflow/svelte';

	interface Props {
		// Called when the user presses Cmd/Ctrl+D with one or more nodes
		// selected. The host re-emits the mutation through the composer so
		// graph and xyflow state stay in lockstep.
		onDuplicate: (selected: XYNode[]) => void;
	}

	let { onDuplicate }: Props = $props();

	const flow = useSvelteFlow();

	function onKeyDown(e: KeyboardEvent) {
		// Don't intercept while the user is typing — text inputs and similar
		// should keep all their key combos.
		const target = e.target as HTMLElement | null;
		if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
		if (target && target.isContentEditable) return;

		const mod = e.metaKey || e.ctrlKey;
		if (mod && (e.key === 'd' || e.key === 'D')) {
			e.preventDefault();
			const selected = flow.getNodes().filter((n) => n.selected);
			if (selected.length > 0) onDuplicate(selected);
			return;
		}
		if (!mod && (e.key === 'f' || e.key === 'F')) {
			e.preventDefault();
			void flow.fitView({ padding: 0.25, duration: 250 });
		}
	}
</script>

<svelte:document onkeydown={onKeyDown} />
