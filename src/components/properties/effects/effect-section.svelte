<script lang="ts">
  import type { Effect, ShaderClass } from "@/shaders/core/shader.svelte";
  import { composer } from "@/lib/state/composer.svelte";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import { cn } from "@/lib/utils";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import EffectPopover from "./effect-popover.svelte";

  interface Props {
    label: string;
    items: Effect[];
    options: ShaderClass[];
    onPick: (typeId: string) => void;
    onRemove: (id: string) => void;
  }

  let { label, items, options, onPick, onRemove }: Props =
    $props();
</script>

<section
  class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)] last:border-b-0"
>
  <div class="flex items-center justify-between px-1">
    <p class="text-[14px] font-medium text-white">{label}</p>
    {#if options.length > 0}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="h-6 w-6 p-0 inline-flex items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus class="size-4" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            align="end"
            sideOffset={4}
            class=" min-w-40 z-50"
          >
            {#each options as cls (cls.typeId)}
              <DropdownMenu.Item
                class="flex items-center gap-2 px-2 py-1.5 text-[13px] rounded-md cursor-pointer text-white/90 hover:bg-white/5 data-highlighted:bg-white/5 outline-none"
                onclick={() => onPick(cls.typeId)}
              >
                <span
                  class="size-2.5 rounded-[3px] shrink-0"
                  style:background-color={cls.meta.color}
                  aria-hidden="true"
                ></span>
                {cls.meta.name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    {/if}
  </div>

  {#if items.length > 0} 
    <div class="space-y-1">
      {#each items as fx (fx.id)}
        {@const isOpen = composer.openEffectId === fx.id}
        <EffectPopover
          effect={fx}
          open={isOpen}
          onOpenChange={(o) => composer.openEffect(o ? fx.id : null)}
        >
          {#snippet trigger({ props })}
            <div
              {...props}
              class={cn(
                "group/fxrow relative flex items-center gap-2 h-9 rounded-lg px-3 transition-colors w-full cursor-pointer",
                isOpen
                  ? "bg-[var(--indigo-700)] text-white"
                  : "bg-[var(--surface-strong)] text-white hover:bg-[var(--surface-hover)]",
                !fx.enabled && "opacity-60",
              )}
            >
              <span
                class="size-3 rounded-[3px] shrink-0"
                style:background-color={fx.meta.color}
                aria-hidden="true"
              ></span>
              <span
                class="flex-1 min-w-0 text-left text-[13px] font-medium truncate"
              >
                {fx.meta.name}
              </span>
              <span
                class="flex items-center gap-0.5 opacity-0 group-hover/fxrow:opacity-100 transition-opacity"
                class:opacity-100={isOpen}
              >
                <button
                  type="button"
                  class="p-1 text-white/70 hover:text-white"
                  onclick={(e) => {
                    e.stopPropagation();
                    composer.toggleNode(fx.id);
                  }}
                  aria-label="Toggle effect"
                >
                  {#if fx.enabled}
                    <Eye class="size-3.5" />
                  {:else}
                    <EyeOff class="size-3.5" />
                  {/if}
                </button>
                <button
                  type="button"
                  class="p-1 text-white/70 hover:text-white"
                  onclick={(e) => {
                    e.stopPropagation();
                    onRemove(fx.id);
                  }}
                  aria-label="Remove effect"
                >
                  <Trash2 class="size-3.5" />
                </button>
              </span>
            </div>
          {/snippet}
        </EffectPopover>
      {/each}
    </div>
  {/if}
</section>
