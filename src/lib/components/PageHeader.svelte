<script lang="ts">
  import type { Snippet } from 'svelte';

  // Page title block: one h1 size on every page, an optional line under it, actions on the right.
  let { title, subtitle = '', actions }: { title: string; subtitle?: string; actions?: Snippet } = $props();
</script>

<div class="flex flex-wrap items-start gap-2">
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <h1 class="text-xl leading-7 font-semibold tracking-tight break-words">{title}</h1>
    {#if subtitle}<p class="text-sm text-muted-foreground">{subtitle}</p>{/if}
  </div>
  {#if actions}<div class="flex shrink-0 flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</div>
