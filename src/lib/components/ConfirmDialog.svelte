<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { buttonVariants, type ButtonSize, type ButtonVariant } from '$lib/components/ui/button';

  let {
    title,
    description,
    confirmLabel = 'Sil',
    label,
    variant = 'ghost',
    size = 'icon-sm',
    triggerClass = '',
    onconfirm,
    children,
  }: {
    title: string;
    description: string;
    confirmLabel?: string;
    /** Accessible name of the trigger button. */
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    triggerClass?: string;
    onconfirm: () => void;
    children: Snippet;
  } = $props();
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger class="{buttonVariants({ variant, size })} {triggerClass}" aria-label={label} title={label}>
    {@render children()}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onconfirm}>{confirmLabel}</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
