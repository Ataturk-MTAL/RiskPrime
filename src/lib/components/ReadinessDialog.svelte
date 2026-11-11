<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { countUntransferred } from '$lib/domain/transfer';
  import type { GapEntry, MetaField } from '$lib/domain/readiness';
  import { store } from '$lib/state.svelte';

  const META_LABELS: Record<MetaField, string> = {
    school: 'Okul adı',
    period: 'Dönem',
    assessmentDate: 'Değerlendirme tarihi',
    validUntil: 'Geçerlilik tarihi',
  };

  const gaps = $derived(store.readinessGaps);
  const untransferred = $derived(countUntransferred(store.assessment));

  function close() {
    store.readinessGaps = null;
  }

  function go(select: () => void) {
    select();
    close();
  }
</script>

{#snippet entries(list: GapEntry[], suffix: string, select: (id: string) => void)}
  <ul class="flex flex-col items-start gap-0.5">
    {#each list as g (g.id)}
      <li>
        <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => go(() => select(g.id))}>
          {g.name || 'Adsız'}
        </Button>
        <span class="text-muted-foreground">: {g.count} {suffix}{g.detail ? ` (${g.detail})` : ''}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<AlertDialog.Root open={gaps !== null} onOpenChange={(open) => !open && close()}>
  <AlertDialog.Content class="data-[size=default]:sm:max-w-lg">
    <AlertDialog.Header>
      <AlertDialog.Title>PDF eksiklerle çıkacak</AlertDialog.Title>
      <AlertDialog.Description>
        {#if gaps}Puanlanan satır: {gaps.totals.scoredRows} / {gaps.totals.totalRows}.{' '}{/if}İmzalanacak belgede şu eksikler var:
      </AlertDialog.Description>
    </AlertDialog.Header>
    {#if gaps}
      <div class="flex max-h-[50vh] flex-col gap-3 overflow-y-auto text-sm">
        {#if gaps.missingMeta.length}
          <section>
            <h3 class="font-semibold">Eksik bilgi</h3>
            <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => go(() => store.openSchool())}>
              {gaps.missingMeta.map((m) => META_LABELS[m]).join(', ')}
            </Button>
          </section>
        {/if}
        {#if gaps.invalidDates}
          <section>
            <h3 class="font-semibold">Tarihler</h3>
            <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => go(() => store.openSchool())}>
              Geçerlilik tarihi değerlendirme tarihinden önce
            </Button>
          </section>
        {/if}
        {#if gaps.emptySignatories}
          <section>
            <h3 class="font-semibold">İmza</h3>
            <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => go(() => store.openSchool())}>
              {gaps.emptySignatories} imzacının adı boş
            </Button>
          </section>
        {/if}
        {#if gaps.unscored.length}
          <section>
            <h3 class="font-semibold">Olasılık ya da şiddet puanı boş satırlar</h3>
            {@render entries(gaps.unscored, 'satır', (id) => store.selectLocation(id))}
          </section>
        {/if}
        {#if gaps.missingAction.length}
          <section>
            <h3 class="font-semibold">Yüksek/tolere edilemez riskte önlem ya da sorumlu boş</h3>
            {@render entries(gaps.missingAction, 'satır', (id) => store.selectLocation(id))}
          </section>
        {/if}
        {#if gaps.emptyHazard.length}
          <section>
            <h3 class="font-semibold">Tehlike ve risk alanı boş satırlar</h3>
            {@render entries(gaps.emptyHazard, 'satır', (id) => store.selectLocation(id))}
          </section>
        {/if}
        {#if gaps.doneWithoutAfter.length}
          <section>
            <h3 class="font-semibold">Tamamlandı ama önlem sonrası puanı yok</h3>
            {@render entries(gaps.doneWithoutAfter, 'satır', (id) => store.selectLocation(id))}
          </section>
        {/if}
        {#if gaps.noWithoutRow.length}
          <section>
            <h3 class="font-semibold">Risk tablosuna aktarılmamış eksikler</h3>
            {@render entries(gaps.noWithoutRow, 'eksik', (id) => store.selectChecklist(id))}
            <Button variant="outline" size="sm" class="mt-1" disabled={untransferred === 0} onclick={() => { store.transferMissing(); close(); }}>Tüm eksikleri aktar ({untransferred})</Button>
          </section>
        {/if}
        {#if gaps.sourceNowYes.length}
          <section>
            <h3 class="font-semibold">Eksiği giderilmiş (Evet olmuş) ama açık satırlar</h3>
            {@render entries(gaps.sourceNowYes, 'satır', (id) => store.selectLocation(id))}
          </section>
        {/if}
        {#if gaps.unanswered.length}
          <section>
            <h3 class="font-semibold">Cevaplanmamış kontrol listesi maddeleri</h3>
            {@render entries(gaps.unanswered, 'madde', (id) => store.selectChecklist(id))}
          </section>
        {/if}
      </div>
    {/if}
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Vazgeç</AlertDialog.Cancel>
      <AlertDialog.Action
        variant="outline"
        onclick={() => {
          close();
          void store.exportAs('pdf-full');
        }}>Yine de PDF indir</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
