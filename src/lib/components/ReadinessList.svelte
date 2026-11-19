<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { countUntransferred } from '$lib/domain/transfer';
  import type { GapEntry, MetaField, Readiness } from '$lib/domain/readiness';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const META_LABELS: Record<MetaField, string> = {
    school: 'Okul adı',
    period: 'Dönem',
    assessmentDate: 'Değerlendirme tarihi',
    validUntil: 'Geçerlilik tarihi',
  };

  /** `onpick` runs after any jump or transfer, so the dialog can close itself. */
  let { gaps, onpick = () => {} }: { gaps: Readiness; onpick?: () => void } = $props();

  const untransferred = $derived(countUntransferred(store.assessment));

  function go(select: () => void) {
    select();
    onpick();
  }
  const openSchool = () => go(() => nav.openReport(true));
  const openRisks = (id: string) => go(() => nav.openRegister({ locationId: id }));
  // Gap ids of checklist entries are template ids; the answers live in the locations.
  const openUnanswered = () => go(() => nav.go('locations'));
  const openUntransferred = (listId: string) =>
    go(() => nav.openDeficiencies({ listId, state: 'untransferred' }));
</script>

{#snippet entries(list: GapEntry[], suffix: string, select: (id: string) => void)}
  <ul class="flex flex-col items-start gap-0.5">
    {#each list as g (g.id)}
      <li>
        <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => select(g.id)}>
          {g.name || 'Adsız'}
        </Button>
        <span class="text-muted-foreground">: {g.count} {suffix}{g.detail ? ` (${g.detail})` : ''}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="flex flex-col gap-3 text-sm">
  {#if gaps.missingMeta.length}
    <section>
      <h3 class="font-semibold">Boş alanlar</h3>
      <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={openSchool}>
        {gaps.missingMeta.map((m) => META_LABELS[m]).join(', ')}
      </Button>
    </section>
  {/if}
  {#if gaps.invalidDates}
    <section>
      <h3 class="font-semibold">Tarihler</h3>
      <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={openSchool}>
        Geçerlilik tarihi değerlendirme tarihinden önce
      </Button>
    </section>
  {/if}
  {#if gaps.emptySignatories}
    <section>
      <h3 class="font-semibold">İmza</h3>
      <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={openSchool}>
        {gaps.emptySignatories} imzacının adı boş
      </Button>
    </section>
  {/if}
  {#if gaps.unscored.length}
    <section>
      <h3 class="font-semibold">Olasılık ya da şiddet puanı boş satırlar</h3>
      {@render entries(gaps.unscored, 'satır', openRisks)}
    </section>
  {/if}
  {#if gaps.missingAction.length}
    <section>
      <h3 class="font-semibold">Yüksek/tolere edilemez riskte önlem ya da sorumlu boş</h3>
      {@render entries(gaps.missingAction, 'satır', openRisks)}
    </section>
  {/if}
  {#if gaps.emptyHazard.length}
    <section>
      <h3 class="font-semibold">Tehlike ve risk alanı boş satırlar</h3>
      {@render entries(gaps.emptyHazard, 'satır', openRisks)}
    </section>
  {/if}
  {#if gaps.doneWithoutAfter.length}
    <section>
      <h3 class="font-semibold">Tamamlandı ama önlem sonrası puanı yok</h3>
      {@render entries(gaps.doneWithoutAfter, 'satır', openRisks)}
    </section>
  {/if}
  {#if gaps.noWithoutRow.length}
    <section>
      <h3 class="font-semibold">Risk tablosuna aktarılmamış eksikler</h3>
      {@render entries(gaps.noWithoutRow, 'eksik', openUntransferred)}
      <Button variant="outline" size="sm" class="mt-1" disabled={untransferred === 0} onclick={() => go(() => store.transferMissing())}>Tüm eksikleri aktar ({untransferred})</Button>
    </section>
  {/if}
  {#if gaps.sourceNowYes.length}
    <section>
      <h3 class="font-semibold">Eksiği giderilmiş (Evet olmuş) ama açık satırlar</h3>
      {@render entries(gaps.sourceNowYes, 'satır', openRisks)}
    </section>
  {/if}
  {#if gaps.unanswered.length}
    <section>
      <h3 class="font-semibold">Cevaplanmamış kontrol listesi maddeleri</h3>
      {@render entries(gaps.unanswered, 'madde', openUnanswered)}
    </section>
  {/if}
</div>
