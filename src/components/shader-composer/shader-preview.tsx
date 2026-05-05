"use client";

import { useRef, useEffect } from "react";
import { useComposer } from "@/state/composer";
import { generate, type GeneratedPass, type GeneratedUniform } from "@/lib/codegen";
import { isProcessingNode } from "@/shaders/core/node";
import {
  createShaderPipeline,
  type PipelineHandle,
} from "@/lib/codegen/runtime/runtime-shell";
import { TextureCache } from "@/lib/codegen/runtime/texture-cache";
import { JsLayerRunner } from "@/lib/codegen/runtime/js-layer-runner";
import type { ImageInputValue } from "@/shaders/core/schemas";

const FIT_MODE: Record<string, number> = {
  cover: 0,
  contain: 1,
  fill: 2,
};

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

  const { chain } = useComposer();

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

    return () => {
      cancelAnimationFrame(animationRef.current);
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

    pipelineRef.current?.destroy();
    pipelineRef.current = null;
    passesRef.current = [];
    uniformsRef.current = [];

    const enabled = chain.enabled;
    if (enabled.length === 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    const { passes, vertexShader, uniforms } = generate(chain);
    passesRef.current = passes;
    uniformsRef.current = uniforms;
    pipelineRef.current = createShaderPipeline(
      gl,
      vertexShader,
      passes.map((p) => ({ fragment: p.fragmentShader, readsPrevPass: p.readsPrevPass }))
    );

    // Drop JS-runner state for nodes that no longer exist or were disabled.
    jsRunnerRef.current?.prune(new Set(enabled.map((n) => n.id)));
  }, [chain]);

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

      pipeline.render(time, w, h, (ctx, program) => {
        const pass = passes[ctx.passIndex];
        let textureUnit = ctx.nextTextureUnit;
        for (const nodeId of pass.nodeIds) {
          const node = chain.nodes.find((n) => n.id === nodeId);
          if (!node) continue;
          const prefix = node.prefix;

          // Per-node opacity.
          const opacityLocation = gl.getUniformLocation(
            program,
            `u_${prefix}_opacity`
          );
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
            const loc = gl.getUniformLocation(
              program,
              `u_${prefix}_jsOutput`
            );
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
                gl.uniform1f(
                  gl.getUniformLocation(program, baseName),
                  value as number
                );
                break;
              case "vec2":
                gl.uniform2fv(
                  gl.getUniformLocation(program, baseName),
                  value as number[]
                );
                break;
              case "vec3":
                gl.uniform3fv(
                  gl.getUniformLocation(program, baseName),
                  value as number[]
                );
                break;
              case "vec4":
                gl.uniform4fv(
                  gl.getUniformLocation(program, baseName),
                  value as number[]
                );
                break;
              case "int":
                gl.uniform1i(
                  gl.getUniformLocation(program, baseName),
                  value as number
                );
                break;
              case "bool":
                gl.uniform1i(
                  gl.getUniformLocation(program, baseName),
                  value ? 1 : 0
                );
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
                gl.uniform1i(
                  gl.getUniformLocation(program, baseName),
                  textureUnit
                );
                gl.uniform4fv(
                  gl.getUniformLocation(program, `${baseName}_meta`),
                  [
                    entry?.aspect ?? 1,
                    FIT_MODE[img?.fit ?? "cover"] ?? 0,
                    img?.scale ?? 1,
                    img?.rotation ?? 0,
                  ]
                );
                const imageAspectLocation = gl.getUniformLocation(
                  program,
                  "u_imageAspectRatio"
                );
                if (imageAspectLocation !== null) {
                  gl.uniform1f(imageAspectLocation, entry?.aspect ?? 1);
                }
                gl.uniform2fv(
                  gl.getUniformLocation(program, `${baseName}_offset`),
                  [img?.offsetX ?? 0, img?.offsetY ?? 0]
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
                gl.uniform4fv(
                  gl.getUniformLocation(program, baseName),
                  flat
                );
                gl.uniform1i(
                  gl.getUniformLocation(program, `${baseName}_count`),
                  count
                );
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
  }, [chain]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-black"
    />
  );
}
