<script lang="ts">
  import { cn } from "@/lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLElement> {}

  const { class: className, children, ...props }: Props = $props();
</script>

<section
  {...props}
  class={cn(
    "px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)]",
    className,
  )}
>
  {@render children?.()}
</section>
