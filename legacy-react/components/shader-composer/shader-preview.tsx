"use client";

import { useRef, useEffect, useMemo } from "react";
import { useComposer } from "@/state/composer";
import { generate, type GeneratedPass, type GeneratedUniform } from "@/lib/codegen";
import { isProcessingNode } from "@/shaders/core/node";
import { createShaderPipeline, type PipelineHandle } from "@/lib/codegen/runtime/runtime-shell";
import { TextureCache } from "@/lib/codegen/runtime/texture-cache";
import { JsLayerRunner } from "@/lib/codegen/runtime/js-layer-runner";
import type { ImageInputValue } from "@/shaders/core/schemas";
import { CanvasOverlay } from "./canvas-overlay";

const FIT_MODE: Record<string, number> = {
  cover: 0,
  contain: 1,
  fill: 2,
};

function isImageValue(v: unknown): v is ImageInputValue {
  return typeof v === "object" && v !== null && "sourceKind" in (v as Record<string, unknown>);
}

interface PaletteValue {
  values: number[][];
  length: number;
}

function isPaletteValue(v: unknown): v is PaletteValue {
  return typeof v === "object" && v !== null && Array.isArray((v as PaletteValue).values);
}

export function ShaderPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const pipelineRef = useRef<PipelineHandle | null>(null);
  const passesRef = useRef<GeneratedPass[]>([]);
  const uniformsRef = useRef<GeneratedUniform[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const textureCacheRef = useRef<TextureCache | null>(null);
  const jsRunnerRef = useRef<JsLayerRunner | null>(null);

  const { scene, selectedNodeId } = useComposer();
  const selectedLayer = useMemo(() => {
    if (!selectedNodeId) return null;
    const found = scene.findNode(selectedNodeId);
    return found?.layer ?? null;
  }, [scene, selectedNodeId]);

  // Keep latest scene in a ref so the render loop can read live values
  // without tearing down rAF on every config tweak.
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  // Structural signature: rebuild the pipeline only when topology/wiring
  // changes, not on per-config drags. Captures layer/effect identity,
  // ordering, enabled state, and blend modes — anything that would alter
  // generated GLSL or pass layout.
  const structuralKey = useMemo(() => {
    const parts: string[] = [];
    parts.push(`bg:${scene.background.color.join(",")}`);
    for (const layer of scene.layers) {
      parts.push(
        `L:${layer.id}:${layer.enabled ? 1 : 0}:${layer.blendMode}:${layer.source.id}:${layer.source.typeId}:${layer.source.enabled ? 1 : 0}`,
      );
      for (const fx of layer.effects) {
        parts.push(`E:${fx.id}:${fx.typeId}:${fx.enabled ? 1 : 0}:${fx.blendMode}`);
      }
    }
    for (const fx of scene.postEffects) {
      parts.push(`P:${fx.id}:${fx.typeId}:${fx.enabled ? 1 : 0}:${fx.blendMode}`);
    }
    return parts.join("|");
  }, [scene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }
    glRef.current = gl;
    textureCacheRef.current = new TextureCache(gl);
    jsRunnerRef.current = new JsLayerRunner(gl);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      pipelineRef.current?.setMouse(x, y);
    };
    canvas.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      pipelineRef.current?.destroy();
      pipelineRef.current = null;
      textureCacheRef.current?.destroy();
      textureCacheRef.current = null;
      jsRunnerRef.current?.destroy();
      jsRunnerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    const scene = sceneRef.current;

    pipelineRef.current?.destroy();
    pipelineRef.current = null;
    passesRef.current = [];
    uniformsRef.current = [];

    const enabledLayers = scene.enabledLayers;
    if (enabledLayers.length === 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const [r, g, b, a] = scene.background.color;
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    const { passes, vertexShader, uniforms } = generate(scene);
    passesRef.current = passes;
    uniformsRef.current = uniforms;
    pipelineRef.current = createShaderPipeline(
      gl,
      vertexShader,
      passes.map((p) => ({
        fragment: p.fragmentShader,
        readsPrevPass: p.readsPrevPass,
        bindLayerTextures: p.bindLayerTextures,
        commitToLayer: p.commitToLayer,
      })),
      {
        layerCount: enabledLayers.length,
        sceneBackground: scene.background.color,
        layerOpacities: enabledLayers.map((l) => l.opacity),
      },
    );

    // Drop JS-runner state for nodes that no longer exist or were disabled.
    const liveIds = new Set<string>();
    for (const layer of enabledLayers) {
      liveIds.add(layer.source.id);
      for (const fx of layer.effects) liveIds.add(fx.id);
    }
    for (const fx of scene.postEffects) liveIds.add(fx.id);
    jsRunnerRef.current?.prune(liveIds);
  }, [structuralKey]);

  useEffect(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    const render = () => {
      const pipeline = pipelineRef.current;
      const passes = passesRef.current;
      const uniformsList = uniformsRef.current;
      if (!pipeline || passes.length === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, canvas.clientWidth * dpr);
      const h = Math.max(1, canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const time = (Date.now() - startTimeRef.current) / 1000;
      const scene = sceneRef.current;

      // Push scene-level state every frame (cheap, decouples from React reconciliation).
      pipeline.setSceneBackground(scene.background.color);
      pipeline.setLayerOpacities(scene.enabledLayers.map((l) => l.opacity));

      pipeline.render(time, w, h, (ctx, program) => {
        const pass = passes[ctx.passIndex];
        let textureUnit = ctx.nextTextureUnit;
        for (const nodeId of pass.nodeIds) {
          const node = scene.findNode(nodeId)?.node;
          if (!node) continue;
          const prefix = node.prefix;

          // Per-node opacity.
          const opacityLocation = gl.getUniformLocation(program, `u_${prefix}_opacity`);
          if (opacityLocation) gl.uniform1f(opacityLocation, node.opacity);

          // For ProcessingNodes' JS pass, bind the runner-managed output texture
          // and skip normal uniform binding (the synthesized fragment program
          // only references `u_<prefix>_jsOutput` and `u_<prefix>_opacity`).
          // The follow-on glsl-render pass uses normal uniforms — fall through.
          if (isProcessingNode(node) && pass.mode !== "glsl-render") {
            const runner = jsRunnerRef.current;
            if (!runner) continue;
            const tex = runner.ensure(node, () => {});
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            const loc = gl.getUniformLocation(program, `u_${prefix}_jsOutput`);
            if (loc !== null) gl.uniform1i(loc, textureUnit);
            textureUnit += 1;
            continue;
          }

          // Bind every non-opacity, non-jsOutput uniform owned by this node.
          for (const u of uniformsList) {
            if (!u.name.startsWith(`u_${prefix}_`)) continue;
            if (u.originalName === "opacity") continue;
            if (u.originalName === "jsOutput") continue;

            const baseName = u.name;
            const key = u.originalName;
            const cfgRecord = node.config as Record<string, unknown>;
            const inRecord = node.inputs as Record<string, unknown>;
            const value = key in cfgRecord ? cfgRecord[key] : inRecord[key];
            if (value === undefined) continue;

            switch (u.type) {
              case "float":
                gl.uniform1f(gl.getUniformLocation(program, baseName), value as number);
                break;
              case "vec2":
                gl.uniform2fv(gl.getUniformLocation(program, baseName), value as number[]);
                break;
              case "vec3":
                gl.uniform3fv(gl.getUniformLocation(program, baseName), value as number[]);
                break;
              case "vec4":
                gl.uniform4fv(gl.getUniformLocation(program, baseName), value as number[]);
                break;
              case "int":
                gl.uniform1i(gl.getUniformLocation(program, baseName), value as number);
                break;
              case "bool":
                gl.uniform1i(gl.getUniformLocation(program, baseName), value ? 1 : 0);
                break;
              case "sampler2D": {
                const cache = textureCacheRef.current;
                if (!cache) break;
                const img = isImageValue(value) ? value : null;
                let entry = img?.url ? cache.peek(img.url) : null;
                if (img?.url && !entry) {
                  cache.prefetch(img.url);
                }
                const tex = entry?.texture ?? cache.getPlaceholder();
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.uniform1i(gl.getUniformLocation(program, baseName), textureUnit);
                gl.uniform4fv(gl.getUniformLocation(program, `${baseName}_meta`), [
                  entry?.aspect ?? 1,
                  FIT_MODE[img?.fit ?? "cover"] ?? 0,
                  img?.scale ?? 1,
                  img?.rotation ?? 0,
                ]);
                const imageAspectLocation = gl.getUniformLocation(program, "u_imageAspectRatio");
                if (imageAspectLocation !== null) {
                  gl.uniform1f(imageAspectLocation, entry?.aspect ?? 1);
                }
                gl.uniform2fv(gl.getUniformLocation(program, `${baseName}_offset`), [
                  img?.offsetX ?? 0,
                  img?.offsetY ?? 0,
                ]);
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
                gl.uniform4fv(gl.getUniformLocation(program, baseName), flat);
                gl.uniform1i(gl.getUniformLocation(program, `${baseName}_count`), count);
                break;
              }
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full bg-black" />
      <CanvasOverlay canvasRef={canvasRef} layer={selectedLayer} />
    </div>
  );
}
