<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type Option = { value: string; label: string };
  let { options, value, class: className, ...rest }: HTMLSelectAttributes & { options: Option[] } = $props();
</script>

<select
  {value}
  class={cn(
    'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:[&>option]:bg-popover',
    className,
  )}
  {...rest}
>
  {#each options as option (option.value)}
    <option value={option.value} selected={option.value === value}>{option.label}</option>
  {/each}
</select>
