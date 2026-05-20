<script lang="ts">
  import { composer } from "@/lib/state";
  import {
    Effect,
    getEffectScope,
    isGenerator,
    StaticEffect,
    StaticShader,
  } from "@/shaders/core/shader.svelte";

  import Panel from "../panel.svelte";
  import LayerBlending from "./layer-blending.svelte";
  import LayerEffectsSections from "./layer-effects-sections.svelte";
  import LayerFields from "./layer-fields.svelte";
  import LayerOpacity from "./layer-opacity.svelte";
  import LayerPins, { asGraphHost } from "./layer-pins.svelte";

  // Resolve the current selection out of the composer. Returns null when the
  // selection is the scene root (handled by SceneProperties instead) or when
  // nothing is selected.
  let node = $derived.by(() => {
    if (!composer.selectedNodeId) return null;
    return composer.scene.findShader(composer.selectedNodeId)?.shader ?? null;
  });

  // The layer that owns `node`. Used to surface that layer's effect stacks at
  // the bottom of the panel when the selected node IS the layer's source
  // generator. Selecting an individual effect hides those stacks so the user
  // only sees that effect's properties.
  let layer = $derived.by(() => {
    if (!composer.selectedNodeId) return null;
    return composer.scene.findShader(composer.selectedNodeId)?.layer ?? null;
  });

  let isLayerSource = $derived(
    layer != null && node != null && node === layer.source,
  );

  let graphHost = $derived(asGraphHost(node));

  // Schema-driven property rows only make sense for shaders whose inputs are
  // declared via a Zod `static schema`. Procedural shaders / effects expose
  // their parameters through LayerPins instead, and the abstract Shader base
  // has no schema at all — gate at the parent so LayerFields can accept a
  // concrete narrowed type.
  let staticNode = $derived(
    node instanceof StaticShader || node instanceof StaticEffect ? node : null,
  );

  let selectionScope = $derived.by(() => {
    if (!node) return "";
    if (node instanceof Effect) {
      return getEffectScope(node.cls) === "scene" ? "Scene Effect" : "Effect Layer";
    }
    if (isGenerator(node)) return "Layer";
    return "";
  });
</script>

{#if node}
  <Panel title={node.meta.name} label={selectionScope}>
    <LayerBlending {node} />
    <LayerOpacity {node} />
    {#if graphHost}
      <LayerPins field={graphHost} />
    {/if}
    {#if staticNode}
      <LayerFields node={staticNode} />
    {/if}
    {#if isLayerSource && layer}
      <LayerEffectsSections {layer} />
    {/if}
  </Panel>
{/if} 
