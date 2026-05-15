<script lang="ts">
    import { onMount } from "svelte";
    import ShaderPreview from "./shader-preview.svelte";

    // Logical (CSS-pixel) size of the 1:1 artboard at zoom = 1. The WebGL
    // backbuffer is sized to clientWidth * devicePixelRatio, so this also sets
    // the render resolution before zoom-induced upscaling.
    const ARTBOARD_BASE = 1024;
    const MIN_ZOOM = 0.05;
    const MAX_ZOOM = 16;
    const PADDING = 64;

    let viewport = $state<HTMLDivElement | null>(null);
    let viewW = $state(0);
    let viewH = $state(0);

    let zoom = $state(1);
    let panX = $state(0);
    let panY = $state(0);

    let spaceHeld = $state(false);
    let panning = $state(false);

    function fitToView() {
        if (viewW <= 0 || viewH <= 0) return;
        const available = Math.min(viewW, viewH) - PADDING * 2;
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, available / ARTBOARD_BASE));
        zoom = next;
        const scaled = ARTBOARD_BASE * next;
        panX = (viewW - scaled) / 2;
        panY = (viewH - scaled) / 2;
    }

    function clampZoom(z: number) {
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    }

    function zoomAt(clientX: number, clientY: number, factor: number) {
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const next = clampZoom(zoom * factor);
        const k = next / zoom;
        // Keep the point under the cursor stationary in viewport space.
        panX = px - (px - panX) * k;
        panY = py - (py - panY) * k;
        zoom = next;
    }

    function zoomCenter(factor: number) {
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
    }

    function onWheel(e: WheelEvent) {
        // Ctrl/Cmd + wheel (incl. trackpad pinch which fires ctrlKey) zooms;
        // plain wheel / two-finger swipe pans.
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const factor = Math.exp(-e.deltaY * 0.0015);
            zoomAt(e.clientX, e.clientY, factor);
        } else {
            e.preventDefault();
            panX -= e.deltaX;
            panY -= e.deltaY;
        }
    }

    function onPointerDown(e: PointerEvent) {
        // Middle-mouse or space+left starts a pan; everything else falls
        // through to the canvas (layer drag / selection).
        const isPanGesture =
            e.button === 1 || (e.button === 0 && spaceHeld);
        if (!isPanGesture) return;
        e.preventDefault();
        e.stopPropagation();
        panning = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const startX = e.clientX;
        const startY = e.clientY;
        const startPanX = panX;
        const startPanY = panY;
        const onMove = (ev: PointerEvent) => {
            panX = startPanX + (ev.clientX - startX);
            panY = startPanY + (ev.clientY - startY);
        };
        const onUp = (ev: PointerEvent) => {
            panning = false;
            (e.currentTarget as HTMLElement)?.releasePointerCapture?.(ev.pointerId);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" && !e.repeat) {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
            spaceHeld = true;
            e.preventDefault();
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === "0")) {
            e.preventDefault();
            fitToView();
        }
    }
    function onKeyUp(e: KeyboardEvent) {
        if (e.code === "Space") spaceHeld = false;
    }

    onMount(() => {
        if (!viewport) return;
        const ro = new ResizeObserver(() => {
            const rect = viewport!.getBoundingClientRect();
            const first = viewW === 0 && viewH === 0;
            viewW = rect.width;
            viewH = rect.height;
            if (first) fitToView();
        });
        ro.observe(viewport);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            ro.disconnect();
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    });

    const cursor = $derived(
        panning ? "grabbing" : spaceHeld ? "grab" : "default",
    );
</script>

<div
    bind:this={viewport}
    class="artboard-viewport bg-background absolute inset-0 overflow-hidden select-none"
    style:cursor
    onwheel={onWheel}
    onpointerdown={onPointerDown}
    role="presentation"
>
    <div
        class="artboard-frame absolute top-0 left-0 origin-top-left rounded-3xl overflow-hidden shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
        style:width="{ARTBOARD_BASE}px"
        style:height="{ARTBOARD_BASE}px"
        style:transform="translate3d({panX}px, {panY}px, 0) scale({zoom})"
    >
        <ShaderPreview />
    </div>
</div>

<div
    class="absolute bottom-4 right-[316px] glass-floating rounded-full flex items-center gap-1 px-2 py-1 text-[12px] text-white/80 pointer-events-auto z-20"
>
    <button
        class="px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
        onclick={() => zoomCenter(1 / 1.2)}
        aria-label="Zoom out"
    >−</button>
    <button
        class="px-2 py-1 rounded-full hover:bg-white/10 transition-colors min-w-[52px] text-center tabular-nums"
        onclick={fitToView}
        title="Fit (⌘0)"
    >{Math.round(zoom * 100)}%</button>
    <button
        class="px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
        onclick={() => zoomCenter(1.2)}
        aria-label="Zoom in"
    >+</button>
</div>

<style>
    .artboard-viewport { 
        background-image:
            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.06) 1px, transparent 0);
        background-size: 24px 24px;
    }
</style>
