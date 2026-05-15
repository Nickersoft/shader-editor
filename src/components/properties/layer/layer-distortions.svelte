<script lang="ts">
  import type { Layer } from "@/shaders/core/scene.svelte";
  import { generatorSourceKind } from "@/shaders/core/node.svelte";
  import type { Category } from "@/shaders/core/types";
  import { composer } from "@/lib/state/composer.svelte";
  import EffectSection from "../effects/effect-section.svelte";
  import { layerPickerOptions } from "./layer-picker-options";

  interface Props {
    layer: Layer;
  }

  let { layer }: Props = $props();

  const CATEGORIES: Category[] = ["distortion", "blurs"];

  let items = $derived(
    layer.effects.filter((fx) => CATEGORIES.includes(fx.meta.category)),
  );
  
  let options = $derived(
    layerPickerOptions(CATEGORIES, generatorSourceKind(layer.source.cls)),
  );
</script>

<EffectSection
  label="Distortions"
  {items}
  {options} 
  onPick={(typeId) => composer.addEffectToLayer(layer.id, typeId)}
  onRemove={(id) => composer.removeEffectFromLayer(layer.id, id)}
/>
