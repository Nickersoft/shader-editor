<script lang="ts">
	import {
		BaseEdge,
		EdgeReconnectAnchor,
		getBezierPath,
		type EdgeProps,
	} from '@xyflow/svelte';

	// Custom edge wrapper: identical to xyflow's default bezier edge, but with
	// EdgeReconnectAnchor handles invisibly stretched over each endpoint so the
	// user can grab either end and re-route or detach the wire. Without an
	// explicit custom edge, xyflow's built-in edges don't expose reconnect
	// behaviour — the only way to delete a wire would be selecting it and
	// hitting Backspace.

	let {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		style,
		markerStart,
		markerEnd,
		interactionWidth,
	}: EdgeProps = $props();

	let [path] = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
			sourcePosition,
			targetPosition,
		}),
	);

	// Anchor radius — visually invisible but generously sized so endpoints are
	// easy to grab. Matches the visible handle dot of 12px so the hit zones
	// don't appear to extend onto the graph background.
	const ANCHOR_SIZE = 16;
</script>

<BaseEdge {id} {path} {style} {markerStart} {markerEnd} {interactionWidth} />

<EdgeReconnectAnchor
	type="source"
	position={{ x: sourceX, y: sourceY }}
	size={ANCHOR_SIZE}
	class="graph-edge-anchor"
/>
<EdgeReconnectAnchor
	type="target"
	position={{ x: targetX, y: targetY }}
	size={ANCHOR_SIZE}
	class="graph-edge-anchor"
/>
