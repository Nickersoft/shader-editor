<script lang="ts">
  import { untrack } from "svelte";
  import { composer } from "@/lib/state/composer.svelte";
  import {
    generate,
    type GeneratedPass,
    type GeneratedUniform,
  } from "@/lib/codegen";
  import { isProcessingNode } from "@/shaders/core/node.svelte";
  import {
    createShaderPipeline,
    type PipelineHandle,
  } from "@/lib/codegen/runtime/runtime-shell";
  import { TextureCache } from "@/lib/codegen/runtime/texture-cache";
  import { JsLayerRunner } from "@/lib/codegen/runtime/js-layer-runner";
  import type { ImageInputValue } from "@/shaders/core/schemas";
  import { hitTestLayerBody, translateShape } from "@/lib/canvas-hit-test";
  import type { SpatialControlsSpec } from "@/shaders/core/spatial";
  import { hasSpatialControls } from "./canvas/guards";
  import CanvasOverlay from "./canvas/canvas-overlay.svelte";

  const FIT_MODE: Record<string, number> = { cover: 0, contain: 1, fill: 2 };

  function isImageValue(v: unknown): v is ImageInputValue {
    return (
      typeof v === "object" &&
      v !== null &&
      "sourceKind" in (v as Record<string, unknown>)
    );
  }

  interface PaletteValue {
    values: number[][];
    length: number;
  }

  function isPaletteValue(v: unknown): v is PaletteValue {
    return (
      typeof v === "object" &&
      v !== null &&
      Array.isArray((v as PaletteValue).values)
    );
  }

  let canvas = $state<HTMLCanvasElement | null>(null);
  let gl: WebGL2RenderingContext | null = null;
  let pipeline: PipelineHandle | null = null;
  let passes: GeneratedPass[] = [];
  let uniforms: GeneratedUniform[] = [];
  let layerRefs: { id: string }[] = [];
  let animationId = 0;
  const startTime = Date.now();
  let textureCache: TextureCache | null = null;
  let jsRunner: JsLayerRunner | null = null;

  let scene = $derived(composer.scene);
  let selectedLayer = $derived.by(() => {
    if (!composer.selectedNodeId) return null;
    return composer.scene.findNode(composer.selectedNodeId)?.layer ?? null;
  });

  let structuralKey = $derived.by(() => {
    const parts: string[] = [];
    parts.push(`bg:${scene.background.color.join(",")}`);
    const walkLayer = (layer: typeof scene.layers[number], depth: number) => {
      parts.push(
        `L${depth}:${layer.id}:${layer.enabled ? 1 : 0}:${layer.blendMode}:${layer.source.id}:${layer.source.typeId}:${layer.source.enabled ? 1 : 0}:${layer.source.structuralKey()}`,
      );
      for (const fx of layer.effects) {
        parts.push(
          `E${depth}:${fx.id}:${fx.typeId}:${fx.enabled ? 1 : 0}:${fx.blendMode}:${fx.structuralKey()}`,
        );
      }
      for (const child of layer.children) walkLayer(child, depth + 1);
    };
    for (const layer of scene.layers) walkLayer(layer, 0);
    for (const fx of scene.postEffects) {
      parts.push(
        `P:${fx.id}:${fx.typeId}:${fx.enabled ? 1 : 0}:${fx.blendMode}:${fx.structuralKey()}`,
      );
    }
    return parts.join("|");
  });

  // Mount: set up GL context, mouse listener, render loop. Cleanup on unmount.
  $effect(() => {
    if (!canvas) return;

    const ctx = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!ctx) {
      console.error("WebGL2 not supported");
      return;
    }
    gl = ctx;
    textureCache = new TextureCache(gl);
    jsRunner = new JsLayerRunner(gl);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      pipeline?.setMouse(x, y);
    };
    canvas.addEventListener("mousemove", onMouseMove);

    // Pointerdown on a shape both selects the layer and starts a body-drag
    // translation. Walks top-to-bottom (topmost layer wins); misses leave
    // the current selection alone. Drag deltas are applied to a config
    // snapshot taken at pointerdown so the move stays absolute and doesn't
    // drift across frames.
    type DragState = {
      sourceId: string;
      startConfig: Record<string, unknown>;
      spec: SpatialControlsSpec | undefined;
      startPx: number;
      startPy: number;
      rectWidth: number;
      rectHeight: number;
      pointerId: number;
    };
    let drag: DragState | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = canvas!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const layers = composer.scene.layers;
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.enabled) continue;
        const cls = layer.source.cls;
        if (!hasSpatialControls(cls)) continue;
        const config = layer.source.config;
        if (
          hitTestLayerBody(
            cls.spatialControls,
            config,
            px,
            py,
            rect.width,
            rect.height,
          )
        ) {
          composer.selectNode(layer.source.id);
          drag = {
            sourceId: layer.source.id,
            startConfig: { ...config },
            spec: cls.spatialControls,
            startPx: px,
            startPy: py,
            rectWidth: rect.width,
            rectHeight: rect.height,
            pointerId: e.pointerId,
          };
          canvas!.setPointerCapture(e.pointerId);
          return;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      const rect = canvas!.getBoundingClientRect();
      const dx =
        (e.clientX - rect.left - drag.startPx) / Math.max(drag.rectWidth, 1);
      const dy =
        -(e.clientY - rect.top - drag.startPy) / Math.max(drag.rectHeight, 1);
      const updates = translateShape(drag.spec, drag.startConfig, dx, dy);
      if (updates) composer.updateConfigBatch(drag.sourceId, updates);
    };

    const onPointerUp = () => {
      if (!drag) return;
      canvas!.releasePointerCapture(drag.pointerId);
      drag = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const render = () => {
      if (!pipeline || passes.length === 0 || !gl || !canvas) {
        animationId = requestAnimationFrame(render);
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, canvas.clientWidth * dpr);
      const h = Math.max(1, canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const time = (Date.now() - startTime) / 1000;
      const s = composer.scene;
      pipeline.setSceneBackground(s.background.color);
      // Opacities indexed in compositor order — matches `u_layer_<i>` slots
      // populated by the codegen plan, including clip-mask children.
      pipeline.setLayerOpacities(
        layerRefs.map((ref) => s.findLayer(ref.id)?.opacity ?? 1),
      );

      pipeline.render(time, w, h, (renderCtx, program) => {
        const pass = passes[renderCtx.passIndex];
        let textureUnit = renderCtx.nextTextureUnit;
        for (const nodeId of pass.nodeIds) {
          const node = s.findNode(nodeId)?.node;
          if (!node) continue;
          const prefix = node.prefix;

          const opacityLocation = gl!.getUniformLocation(
            program,
            `u_${prefix}_opacity`,
          );
          if (opacityLocation) gl!.uniform1f(opacityLocation, node.opacity);

          if (isProcessingNode(node) && pass.mode !== "glsl-render") {
            if (!jsRunner) continue;
            const tex = jsRunner.ensure(node, () => {});
            gl!.activeTexture(gl!.TEXTURE0 + textureUnit);
            gl!.bindTexture(gl!.TEXTURE_2D, tex);
            const loc = gl!.getUniformLocation(program, `u_${prefix}_jsOutput`);
            if (loc !== null) gl!.uniform1i(loc, textureUnit);
            textureUnit += 1;
            continue;
          }

          for (const u of uniforms) {
            if (!u.name.startsWith(`u_${prefix}_`)) continue;
            if (u.originalName === "opacity") continue;
            if (u.originalName === "jsOutput") continue;
            const baseName = u.name;
            const key = u.originalName;
            const cfgRecord = node.config as Record<string, unknown>;
            const inRecord = node.inputs as Record<string, unknown>;
            let value: unknown;
            if (u.originalPath) {
              // Walk the dotted path from the node root — used by container
              // nodes (e.g. ProceduralField) whose uniforms live inside nested
              // substructure. The path includes the root key (config / inputs).
              let cursor: unknown = node;
              for (const seg of u.originalPath) {
                if (cursor && typeof cursor === "object") {
                  cursor = (cursor as Record<string, unknown>)[seg];
                } else {
                  cursor = undefined;
                  break;
                }
              }
              value = cursor;
            } else {
              value = key in cfgRecord ? cfgRecord[key] : inRecord[key];
            }
            if (value === undefined) continue;

            switch (u.type) {
              case "float":
                gl!.uniform1f(
                  gl!.getUniformLocation(program, baseName),
                  value as number,
                );
                break;
              case "vec2":
                gl!.uniform2fv(
                  gl!.getUniformLocation(program, baseName),
                  value as number[],
                );
                break;
              case "vec3":
                gl!.uniform3fv(
                  gl!.getUniformLocation(program, baseName),
                  value as number[],
                );
                break;
              case "vec4":
                gl!.uniform4fv(
                  gl!.getUniformLocation(program, baseName),
                  value as number[],
                );
                break;
              case "int":
                gl!.uniform1i(
                  gl!.getUniformLocation(program, baseName),
                  value as number,
                );
                break;
              case "bool":
                gl!.uniform1i(
                  gl!.getUniformLocation(program, baseName),
                  value ? 1 : 0,
                );
                break;
              case "sampler2D": {
                if (!textureCache) break;
                const img = isImageValue(value) ? value : null;
                let entry = img?.url ? textureCache.peek(img.url) : null;
                if (img?.url && !entry) textureCache.prefetch(img.url);
                const tex = entry?.texture ?? textureCache.getPlaceholder();
                gl!.activeTexture(gl!.TEXTURE0 + textureUnit);
                gl!.bindTexture(gl!.TEXTURE_2D, tex);
                gl!.uniform1i(
                  gl!.getUniformLocation(program, baseName),
                  textureUnit,
                );
                gl!.uniform4fv(
                  gl!.getUniformLocation(program, `${baseName}_meta`),
                  [
                    entry?.aspect ?? 1,
                    FIT_MODE[img?.fit ?? "cover"] ?? 0,
                    img?.scale ?? 1,
                    img?.rotation ?? 0,
                  ],
                );
                const imageAspectLocation = gl!.getUniformLocation(
                  program,
                  "u_imageAspectRatio",
                );
                if (imageAspectLocation !== null) {
                  gl!.uniform1f(imageAspectLocation, entry?.aspect ?? 1);
                }
                gl!.uniform2fv(
                  gl!.getUniformLocation(program, `${baseName}_offset`),
                  [img?.offsetX ?? 0, img?.offsetY ?? 0],
                );
                textureUnit += 1;
                break;
              }
              case "vec4Array": {
                if (!isPaletteValue(value)) break;
                const len = u.arrayLength ?? 10;
                const flat = new Float32Array(len * 4);
                const count = Math.min(value.length, value.values.length, len);
                for (let i = 0; i < count; i++) {
                  const c = value.values[i];
                  flat[i * 4 + 0] = c[0] ?? 0;
                  flat[i * 4 + 1] = c[1] ?? 0;
                  flat[i * 4 + 2] = c[2] ?? 0;
                  flat[i * 4 + 3] = c[3] ?? 1;
                }
                gl!.uniform4fv(gl!.getUniformLocation(program, baseName), flat);
                gl!.uniform1i(
                  gl!.getUniformLocation(program, `${baseName}_count`),
                  count,
                );
                break;
              }
            }
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      canvas?.removeEventListener("mousemove", onMouseMove);
      canvas?.removeEventListener("pointerdown", onPointerDown);
      canvas?.removeEventListener("pointermove", onPointerMove);
      canvas?.removeEventListener("pointerup", onPointerUp);
      canvas?.removeEventListener("pointercancel", onPointerUp);
      pipeline?.destroy();
      pipeline = null;
      textureCache?.destroy();
      textureCache = null;
      jsRunner?.destroy();
      jsRunner = null;
    };
  });

  // Rebuild pipeline when topology changes. Only structuralKey is tracked;
  // the scene read is untracked so per-config mutations don't rebuild.
  $effect(() => {
    void structuralKey;
    if (!gl) return;
    const s = untrack(() => composer.scene);

    pipeline?.destroy();
    pipeline = null;
    passes = [];
    uniforms = [];

    if (s.enabledLayers.length === 0) {
      layerRefs = [];
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const [r, g, b, a] = s.background.color;
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    const generated = generate(s);
    passes = generated.passes;
    uniforms = generated.uniforms;
    // The compositor binds `u_layer_<i>` against the planner's flattened layer
    // list (parents + clip-mask children), not just top-level layers, so the
    // FBO pool and opacity array must mirror that.
    layerRefs = generated.layerRefs;
    pipeline = createShaderPipeline(
      gl,
      generated.vertexShader,
      generated.passes.map((p) => ({
        fragment: p.fragmentShader,
        readsPrevPass: p.readsPrevPass,
        bindLayerTextures: p.bindLayerTextures,
        commitToLayer: p.commitToLayer,
      })),
      {
        layerCount: layerRefs.length,
        sceneBackground: s.background.color,
        layerOpacities: layerRefs.map((ref) => s.findLayer(ref.id)?.opacity ?? 1),
      },
    );

    const liveIds = new Set<string>();
    for (const ref of layerRefs) {
      const layer = s.findLayer(ref.id);
      if (!layer) continue;
      liveIds.add(layer.source.id);
      for (const fx of layer.effects) liveIds.add(fx.id);
    }
    for (const fx of s.postEffects) liveIds.add(fx.id);
    jsRunner?.prune(liveIds);
  });
</script>

<div class="relative w-full h-full transparency-checker">
  <canvas bind:this={canvas} class="w-full h-full"></canvas>
  <CanvasOverlay {canvas} layer={selectedLayer} />
</div>

<style>
  .transparency-checker {
    background-color: #1a1a1a;
    background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
      linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
      linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
    background-size: 16px 16px;
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
  }
</style>
