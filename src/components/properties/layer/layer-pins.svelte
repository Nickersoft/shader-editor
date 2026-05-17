<script module lang="ts">
  import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
  import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";

  // Shaders whose user-facing parameters live inside an internal node graph,
  // rather than as schema-derived inputs. Property pane defers to this panel
  // for any of them.
  export type GraphHost = ProceduralShader | ProceduralEffect;

  export function asGraphHost(node: unknown): GraphHost | null {
    return node instanceof ProceduralShader || node instanceof ProceduralEffect ? node : null;
  }
</script>

<script lang="ts">
  import { NumberInput } from "@/components/ui/number-input";
  import {
    coerceToPinDefault,
    GROUP_INPUT_TYPE_ID,
    type GraphNode,
    type PinSpec,
  } from "@/shaders/node-graph";

  import * as Inputs from "../inputs";

  interface Props {
    field: GraphHost;
  }

  let { field }: Props = $props();

  let giNode = $derived<GraphNode | null>(
    field.graph.nodes.find((n) => n.typeId === GROUP_INPUT_TYPE_ID) ?? null,
  );

  let pins = $derived<PinSpec[]>(
    giNode ? ((giNode.config as { pins?: PinSpec[] }).pins ?? []) : [],
  );

  function setPin(index: number, value: unknown) {
    const node = giNode;
    if (!node) return;
    const cfg = node.config as { pins: PinSpec[] };
    const existing = cfg.pins[index];
    if (!existing) return;
    // Drag scrubs fire per-frame; equal-value writes would invalidate every
    // $derived reading node.config for no reason.
    if (pinValuesEqual(existing.default, value)) return;
    const next = [...cfg.pins];
    next[index] = { ...existing, default: value as PinSpec["default"] };
    // Per-pin `default` is excluded from the shader fingerprint (see
    // group-input.ts valuePath), so this won't trigger a rebuild.
    cfg.pins = next;
  }

  function pinValuesEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
      for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) return false;
      }
      return true;
    }
    return false;
  }
</script>

{#if giNode}
  <section class="space-y-4 border-b border-[rgba(255,255,255,0.1)] px-3 py-3">
    <div class="flex items-center justify-between px-1">
      <p class="text-[14px] font-medium text-white">Inputs</p>
    </div>

    {#if pins.length > 0}
      {#each pins as pin, i (pin.id)}
        {@const label = pin.label ?? pin.id}
        {#if pin.type === "float"}
          <NumberInput
            {label}
            value={coerceToPinDefault("float", pin.default) as number}
            onChange={(v) => setPin(i, v)}
            step={0.01}
          />
        {:else if pin.type === "int"}
          <NumberInput
            {label}
            value={coerceToPinDefault("int", pin.default) as number}
            onChange={(v) => setPin(i, Math.trunc(v))}
            step={1}
            integer
          />
        {:else if pin.type === "vec3"}
          {@const rgb = coerceToPinDefault("vec3", pin.default) as [number, number, number]}
          <div class="space-y-1.5">
            <p class="px-1 text-[12px] text-white/70">{label}</p>
            <Inputs.Color
              value={[rgb[0], rgb[1], rgb[2], 1]}
              onChange={(v) => setPin(i, [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0])}
            />
          </div>
        {:else if pin.type === "vec4"}
          {@const rgba = coerceToPinDefault("vec4", pin.default) as [
            number,
            number,
            number,
            number,
          ]}
          <div class="space-y-1.5">
            <p class="px-1 text-[12px] text-white/70">{label}</p>
            <Inputs.Color value={rgba} onChange={(v) => setPin(i, v)} />
          </div>
        {:else if pin.type === "vec2"}
          {@const xy = coerceToPinDefault("vec2", pin.default) as [number, number]}
          <div class="space-y-1.5">
            <p class="px-1 text-[12px] text-white/70">{label}</p>
            <div class="grid grid-cols-2 gap-1.5">
              <NumberInput
                label="X"
                value={xy[0]}
                onChange={(nv) => setPin(i, [nv, xy[1]])}
                step={0.01}
              />
              <NumberInput
                label="Y"
                value={xy[1]}
                onChange={(nv) => setPin(i, [xy[0], nv])}
                step={0.01}
              />
            </div>
          </div>
        {:else if pin.type === "bool"}
          <label class="flex items-center gap-2 px-1 text-[12px] text-white/70">
            <input
              type="checkbox"
              checked={pin.default === true}
              onchange={(e) => setPin(i, (e.currentTarget as HTMLInputElement).checked)}
            />
            {label}
          </label>
        {/if}
      {/each}
    {:else}
      <p class="py-2 text-center text-[11px] text-white/40">
        No inputs. Add one on the Group Input node in the graph.
      </p>
    {/if}
  </section>
{/if}
