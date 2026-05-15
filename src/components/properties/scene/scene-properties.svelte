<script>
  import PropertyPanel from "../panel.svelte";
  import SceneSettings from "./scene-settings.svelte";
  import SceneEffects from "./scene-effects.svelte";
  import SceneDistortions from "./scene-distortions.svelte";
  import SceneAdjustments from "./scene-adjustments.svelte";
</script>

<PropertyPanel title="Scene">
  <SceneSettings />
  <SceneEffects />
  <SceneDistortions />
  <SceneAdjustments />
</PropertyPanel>
