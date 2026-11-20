<script lang="ts">
  import type { Component } from 'svelte';
  import { Button } from '$lib/components/ui/button';

  // One calm empty state: icon, one sentence, at most one way forward.
  // oxlint-disable-next-line no-explicit-any -- lucide icons take their own prop type
  let { icon: Icon, text, action }: { icon: Component<any>; text: string; action?: { label: string; run: () => void } } = $props();
</script>

<div class="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
  <Icon class="size-8 text-muted-foreground" aria-hidden="true" />
  <p class="max-w-sm text-sm text-muted-foreground">{text}</p>
  {#if action}<Button variant="outline" size="sm" onclick={action.run}>{action.label}</Button>{/if}
</div>
