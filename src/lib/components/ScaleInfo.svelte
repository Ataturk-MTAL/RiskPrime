<script lang="ts">
  import Info from '@lucide/svelte/icons/info';
  import * as Popover from '$lib/components/ui/popover';
  import { SCALES, type ScaleKind } from './score-options';

  let { kind }: { kind: ScaleKind } = $props();
  const scale = $derived(SCALES[kind]);
</script>

<Popover.Root>
  <Popover.Trigger
    class="inline-flex size-5 items-center justify-center rounded-full align-middle text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    aria-label="{scale.title} ölçeği"
    onclick={(e: MouseEvent) => e.stopPropagation()}
  >
    <Info class="size-3.5" />
  </Popover.Trigger>
  <Popover.Content class="w-80 text-sm" align="start">
    <p class="mb-2 font-semibold">{scale.title}</p>
    <ol class="space-y-1.5">
      {#each scale.items as text, i (i)}
        <li class="flex gap-2">
          <span class="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold tabular-nums">{i + 1}</span>
          <span class="font-normal">{text}</span>
        </li>
      {/each}
    </ol>
    <p class="mt-3 border-t pt-2 text-xs text-muted-foreground">
      Risk = O × Ş. Düzey çarpımdan değil L tipi matristen okunur (MEB Risk Değerlendirme Rehberi).
    </p>
  </Popover.Content>
</Popover.Root>
