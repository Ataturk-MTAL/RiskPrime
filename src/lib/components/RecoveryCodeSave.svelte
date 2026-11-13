<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';

  let { code, onContinue }: { code: string; onContinue: () => void } = $props();

  let saved = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Kurtarma kodu kopyalandı.');
    } catch {
      toast.error('Kopyalanamadı; kodu elle not alın.');
    }
  }
</script>

<div class="space-y-4">
  <p class="text-sm">PIN'inizi unutursanız verilerinize bu kodla yeniden erişirsiniz. Kod yalnız bir kez gösterilir; güvenli bir yere kaydedin.</p>
  <p class="rounded-lg border bg-muted px-3 py-4 text-center font-mono text-xl font-semibold tracking-widest break-all select-all" aria-label="Kurtarma kodu">{code}</p>
  <div class="flex flex-wrap gap-2 print:hidden">
    <Button type="button" variant="outline" onclick={copy}>Kopyala</Button>
    <Button type="button" variant="outline" onclick={() => window.print()}>Yazdır</Button>
  </div>
  <Label class="items-start gap-2 font-normal print:hidden"><Checkbox class="mt-0.5" bind:checked={saved} />Kurtarma kodunu güvenli bir yere kaydettim</Label>
  <Button type="button" class="w-full print:hidden" disabled={!saved} onclick={onContinue}>Devam</Button>
</div>
