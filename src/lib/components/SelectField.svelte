<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import { cn } from '$lib/utils';
  import type { SelectOption } from './score-options';

  let {
    options,
    value,
    onValueChange,
    label,
    size = 'default',
    class: className,
  }: {
    options: SelectOption[];
    value: string;
    onValueChange: (value: string) => void;
    /** Accessible name when there is no visible label. */
    label?: string;
    size?: 'sm' | 'default';
    class?: string;
  } = $props();

  const selected = $derived(options.find((o) => o.value === value));
</script>

<Select.Root type="single" {value} onValueChange={(v) => v !== value && onValueChange(v)}>
  <Select.Trigger {size} aria-label={label} class={cn('w-full min-w-0 text-foreground', className)}>
    <span class="min-w-0 truncate">{selected?.label ?? '—'}</span>
  </Select.Trigger>
  <Select.Content>
    {#each options as option (option.value)}
      <Select.Item value={option.value} label={option.label}>
        <span class="tabular-nums">{option.label}</span>
        {#if option.hint}<span class="text-muted-foreground">{option.hint}</span>{/if}
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
