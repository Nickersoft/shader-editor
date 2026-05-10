<script lang="ts">
	interface Props {
		cx: number;
		cy: number;
		size?: number;
		fill?: string;
		cursor?: string;
		onDrag: (px: number, py: number, e: PointerEvent) => void;
	}

	let { cx, cy, size = 8, fill = 'white', cursor = 'grab', onDrag }: Props = $props();

	let circleEl = $state<SVGCircleElement | null>(null);
	let dragging = false;

	function handlePointerDown(e: PointerEvent) {
		e.stopPropagation();
		dragging = true;
		circleEl?.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const svg = circleEl?.ownerSVGElement;
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		onDrag(e.clientX - rect.left, e.clientY - rect.top, e);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		circleEl?.releasePointerCapture(e.pointerId);
	}
</script>

<circle
	bind:this={circleEl}
	role="button"
	tabindex="0"
	aria-label="Drag handle"
	{cx}
	{cy}
	r={size / 2}
	{fill}
	stroke="#0a0a0a"
	stroke-width={1.5}
	style:cursor
	style:pointer-events="auto"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
/>
