// Canvas hit-testing and translate operations driven by a layer's
// `spatialControls` declaration. Mirrors the coordinate math in
// `canvas-overlay.svelte` (pixel-space, y flipped).

import { resolveSpatialControls, type SpatialControlsSpec } from '@/shaders/core/spatial';

function pointInPolygon(px: number, py: number, poly: Array<[number, number]>): boolean {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		const intersect =
			yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

export function hitTestLayerBody(
	spec: SpatialControlsSpec | undefined,
	config: Record<string, unknown>,
	px: number,
	py: number,
	width: number,
	height: number
): boolean {
	const controls = resolveSpatialControls(spec, config);
	if (controls.length === 0) return false;
	// Shapes render against `_ar = vec2(width/height, 1.0)`, so radii/extents
	// are anchored to canvas height — must match `canvas-overlay.svelte`.
	const base = height;
	const toX = (v: number) => v * width;
	const toY = (v: number) => (1 - v) * height;
	const num = (key: string, fallback: number) => {
		const v = config[key];
		return typeof v === 'number' ? v : fallback;
	};
	const vec2 = (key: string, fallback: [number, number]): [number, number] => {
		const v = config[key];
		return Array.isArray(v) && v.length >= 2 ? [v[0] as number, v[1] as number] : fallback;
	};

	for (const c of controls) {
		if (c.kind === 'transform') {
			// Universal transform: rotated bbox. Inverse-rotate the test point
			// into the bbox's local frame, then check axis-aligned containment.
			const cx = toX(num(c.x, 0.5));
			const cy = toY(num(c.y, 0.5));
			const halfW = (num(c.w, 0.5) / 2) * base;
			const halfH = (num(c.h, 0.5) / 2) * base;
			const rot = (num(c.rotation, 0) * Math.PI) / 180;
			const dx = px - cx;
			const dy = py - cy;
			const cos = Math.cos(-rot);
			const sin = Math.sin(-rot);
			const lx = dx * cos - dy * sin;
			const ly = dx * sin + dy * cos;
			if (Math.abs(lx) <= halfW && Math.abs(ly) <= halfH) return true;
		} else if (c.kind === 'boundingBox') {
			const cx = toX(num(c.cx, 0.5));
			const cy = toY(num(c.cy, 0.5));
			const halfMul = c.halfExtent ? 1 : 0.5;
			const halfW = num(c.w, 0.5) * halfMul * base;
			const halfH = num(c.h, 0.5) * halfMul * base;
			if (Math.abs(px - cx) <= halfW && Math.abs(py - cy) <= halfH) return true;
		} else if (c.kind === 'radius') {
			const cx = toX(num(c.cx, 0.5));
			const cy = toY(num(c.cy, 0.5));
			const r = num(c.r, 0.3) * base;
			if (Math.hypot(px - cx, py - cy) <= r) return true;
		} else if (c.kind === 'radiusVec2') {
			const [vx, vy] = vec2(c.center, [0.5, 0.5]);
			const cx = toX(vx);
			const cy = toY(vy);
			const r = num(c.r, 0.3) * base;
			if (Math.hypot(px - cx, py - cy) <= r) return true;
		} else if (c.kind === 'polygon') {
			const poly: Array<[number, number]> = c.points.map(([xKey, yKey]) => [
				toX(num(xKey, 0.5)),
				toY(num(yKey, 0.5))
			]);
			if (pointInPolygon(px, py, poly)) return true;
		}
	}
	return false;
}

/**
 * Compute the config updates required to translate every position-like field
 * on a layer by `(dx, dy)` in shader UV space (y-up, 0..1). `startConfig` is a
 * snapshot taken at drag-start so the caller can apply absolute deltas without
 * accumulating rounding drift across frames. Returns `null` when nothing on
 * this control set is positional (e.g. an effect that only owns scalars).
 */
export function translateShape(
	spec: SpatialControlsSpec | undefined,
	startConfig: Record<string, unknown>,
	dx: number,
	dy: number
): Record<string, unknown> | null {
	const controls = resolveSpatialControls(spec, startConfig);
	if (controls.length === 0) return null;
	const updates: Record<string, unknown> = {};

	const addNum = (key: string, delta: number) => {
		const v = startConfig[key];
		if (typeof v === 'number') updates[key] = v + delta;
	};
	const addVec2 = (key: string) => {
		const v = startConfig[key];
		if (Array.isArray(v) && v.length >= 2) {
			updates[key] = [(v[0] as number) + dx, (v[1] as number) + dy];
		}
	};

	for (const c of controls) {
		switch (c.kind) {
			case 'transform':
			case 'point':
			case 'colorStop':
				addNum(c.x, dx);
				addNum(c.y, dy);
				break;
			case 'boundingBox':
			case 'radius':
				addNum(c.cx, dx);
				addNum(c.cy, dy);
				break;
			case 'segment':
				addNum(c.from[0], dx);
				addNum(c.from[1], dy);
				addNum(c.to[0], dx);
				addNum(c.to[1], dy);
				break;
			case 'polygon':
				for (const [xKey, yKey] of c.points) {
					addNum(xKey, dx);
					addNum(yKey, dy);
				}
				break;
			case 'pointVec2':
			case 'colorStopVec2':
				addVec2(c.key);
				break;
			case 'radiusVec2':
				addVec2(c.center);
				break;
			case 'segmentVec2':
				addVec2(c.from);
				addVec2(c.to);
				break;
		}
	}
	return Object.keys(updates).length > 0 ? updates : null;
}
