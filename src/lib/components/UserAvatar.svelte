<script lang="ts">
  import { initials } from '$lib/lock-format';
  import { cn } from '$lib/utils';

  let { name, class: className }: { name: string; class?: string } = $props();
</script>

<span aria-hidden="true" class={cn('grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground', className)}>{initials(name)}</span>
