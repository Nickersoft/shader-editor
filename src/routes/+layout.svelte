<script lang="ts">
  import "../app.css";

  import { dev } from "$app/environment";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";

  let { children } = $props();

  if (!dev) injectAnalytics();
</script>

{@render children()}
