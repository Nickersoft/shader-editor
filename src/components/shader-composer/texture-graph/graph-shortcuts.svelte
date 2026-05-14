<script lang="ts">
	import { useSvelteFlow, type Node as XYNode } from '@xyflow/svelte';
	import { composer } from '@/lib/state/composer.svelte';

	interface Props {
		// Called when the user presses Cmd/Ctrl+D with one or more nodes
		// selected. The host re-emits the mutation through the composer so
		// graph and xyflow state stay in lockstep.
		onDuplicate: (selected: XYNode[]) => void;
		// Bindable accessor — the host writes this back so its toolbar can
		// query the live viewport (e.g. "drop a frame where the user looks").
		// Lives here because useSvelteFlow only resolves inside SvelteFlow's
		// context.
		flowToScreenCenter?: () => { x: number; y: number };
	}

	let { onDuplicate, flowToScreenCenter = $bindable() }: Props = $props();

	const flow = useSvelteFlow();
	flowToScreenCenter = () => {
		const wrapper = document.querySelector('.svelte-flow') as HTMLElement | null;
		if (!wrapper) return { x: 0, y: 0 };
		const r = wrapper.getBoundingClientRect();
		return flow.screenToFlowPosition({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
	};

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
		// Cmd/Ctrl+G groups the current selection; Cmd/Ctrl+Shift+G ungroups
		// (Blender uses Ctrl+G / Ctrl+Alt+G, but Shift parallels our other
		// "do the opposite" affordances).
		if (mod && (e.key === 'g' || e.key === 'G')) {
			e.preventDefault();
			const layerId = composer.editingTextureLayerId;
			if (!layerId) return;
			if (e.shiftKey) {
				const selected = flow.getNodes().filter((n) => n.selected);
				if (selected.length !== 1) return;
				const data = selected[0].data as { typeId?: string; nodeId?: string } | undefined;
				if (data?.typeId !== 'group' || !data.nodeId) return;
				composer.ungroupNode(layerId, data.nodeId);
				return;
			}
			const selected = flow
				.getNodes()
				.filter((n) => n.selected && n.type === 'primitive')
				.map((n) => n.id);
			if (selected.length === 0) return;
			composer.makeGroupFromSelection(layerId, selected);
			return;
		}
		if (!mod && (e.key === 'f' || e.key === 'F')) {
			e.preventDefault();
			void flow.fitView({ padding: 0.25, duration: 250 });
			return;
		}
		// Blender-style group navigation: Tab descends into the selected group,
		// Shift+Tab pops back out one level. Tab is preventDefault'd in both
		// cases so the browser doesn't shift focus to the next tabstop.
		if (e.key === 'Tab' && !mod) {
			if (e.shiftKey) {
				e.preventDefault();
				composer.exitGraphGroup();
				return;
			}
			const selected = flow.getNodes().filter((n) => n.selected);
			if (selected.length !== 1) return;
			const data = selected[0].data as { typeId?: string; nodeId?: string } | undefined;
			if (data?.typeId !== 'group' || !data.nodeId) return;
			e.preventDefault();
			composer.enterGraphGroup(data.nodeId);
		}
	}
</script>

<svelte:document onkeydown={onKeyDown} />
