<script lang="ts">
  import { composer } from "@/lib/state/composer.svelte";

  import { LayerProperties } from "./layer";
  import { SceneProperties } from "./scene";
</script>

{#if composer.isSceneSelected}
  <SceneProperties />
{:else}
  <LayerProperties />
{/if}
