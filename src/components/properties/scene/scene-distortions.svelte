<script lang="ts">
  import type { Category } from "@/shaders/core/types";
  import { composer } from "@/lib/state/composer.svelte";
  import EffectSection from "../effects/effect-section.svelte";
  import { scenePickerOptions } from "./scene-picker-options";

  const CATEGORIES: Category[] = ["distortion", "blurs"];

  let items = $derived(
    composer.scene.postEffects.filter((fx) =>
      CATEGORIES.includes(fx.meta.category),
    ),
  );
  let options = $derived(scenePickerOptions(CATEGORIES));
</script>

<EffectSection
  label="Distortions"
  {items}
  {options} 
  onPick={(typeId) => composer.addSceneEffect(typeId)}
  onRemove={(id) => composer.removeSceneEffect(id)}
/>
