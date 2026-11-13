<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let {
    id,
    label,
    value = $bindable(''),
    autofocus = false,
    autocomplete = 'off',
    describedBy,
  }: { id: string; label: string; value?: string; autofocus?: boolean; autocomplete?: 'off' | 'current-password' | 'new-password'; describedBy?: string } = $props();

  let ref = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (autofocus) ref?.focus();
  });
</script>

<div class="space-y-1.5">
  <Label for={id}>{label}</Label>
  <Input
    {id}
    bind:ref
    type="password"
    inputmode="numeric"
    pattern="[0-9]*"
    maxlength={8}
    {autocomplete}
    aria-describedby={describedBy}
    {value}
    oninput={(e) => (value = e.currentTarget.value.replace(/\D/g, ''))}
  />
</div>
