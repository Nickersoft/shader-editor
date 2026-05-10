// Convert a pointer event from screen space into the bbox-local frame
// (centered on the bbox, axis-aligned to the rotated bbox, in pixels).
function pointerToLocal(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
  state: DragState,
): { lx: number; ly: number } {
  const rect = svg.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const dx = px - state.startCx;
  const dy = py - state.startCy;
  const cos = Math.cos(-state.startRotationRad);
  const sin = Math.sin(-state.startRotationRad);
  return { lx: dx * cos - dy * sin, ly: dx * sin + dy * cos };
}
