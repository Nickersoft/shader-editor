<script lang="ts">
  import * as Card from "@/components/ui/card";
  import { ScrollArea } from "../ui/scroll-area";
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    label?: string;
    children: Snippet<[]>;
  }

  const { title, label, children }: Props = $props();
</script>

<Card.Root class="h-full overflow-hidden min-h-0 pointer-events-auto">
  <div class="flex flex-col h-full min-h-0">
    <Card.Header class="flex items-start border-b">
      <div class="flex flex-col gap-1 min-w-0">
        <h2 class="text-sm font-medium text-foreground truncate">{title}</h2>
        {#if label}
          <p class="text-xs text-muted-foreground">{label}</p>
        {/if}
      </div>
    </Card.Header>

    <Card.Content class="px-0 flex-1 min-h-0">
      <ScrollArea class="size-full">
        {@render children?.()}
      </ScrollArea>
    </Card.Content>
  </div>
</Card.Root>
