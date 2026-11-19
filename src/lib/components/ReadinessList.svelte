<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { Button } from '$lib/components/ui/button';
  import { progress, unansweredScope } from '$lib/domain/progress';
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
  const total = (list: GapEntry[]) => list.reduce((n, g) => n + g.count, 0);

  function go(select: () => void) {
    select();
    onpick();
  }
  const openSchool = () => go(() => nav.openSchool());
  const openRisks = (id: string) => go(() => nav.openRegister({ locationId: id }));
  // Gap ids of checklist entries are template ids; send the user where the open items are.
  const openUnanswered = () =>
    go(() =>
      unansweredScope(progress(store.assessment, new Date())) === 'school'
        ? nav.openSchool()
        : nav.go('locations'),
    );
  const openUntransferred = (listId: string) => go(() => nav.openDeficiencies({ listId, state: 'untransferred' }));
</script>

{#snippet entries(list: GapEntry[], suffix: string, select: (id: string) => void)}
  <ul class="flex flex-col items-start gap-0.5 pt-1 pl-5">
    {#each list as g (g.id)}
      <li>
        <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={() => select(g.id)}>{g.name || 'Adsız'}</Button>
        <span class="text-muted-foreground">: {g.count} {suffix}{g.detail ? ` (${g.detail})` : ''}</span>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet summary(title: string, list: GapEntry[])}
  <!-- flex drops the native disclosure triangle, so the chevron is the open/closed cue -->
  <summary class="flex min-h-9 cursor-pointer items-center gap-1 font-semibold">
    <ChevronRight class="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-reduce:transition-none group-open:rotate-90" aria-hidden="true" />{title}<span class="font-normal text-muted-foreground">({total(list)})</span>
  </summary>
{/snippet}

{#snippet group(title: string, list: GapEntry[], suffix: string, select: (id: string) => void)}
  {#if list.length}
    <details class="group">
      {@render summary(title, list)}
      {@render entries(list, suffix, select)}
    </details>
  {/if}
{/snippet}

<div class="flex flex-col gap-2 text-sm">
  {#if gaps.missingMeta.length || gaps.invalidDates || gaps.emptySignatories}
    <section>
      <h3 class="flex min-h-9 items-center font-semibold">Okul bilgileri</h3>
      <Button variant="link" class="h-auto p-0 text-left whitespace-normal" onclick={openSchool}>
        {[
          gaps.missingMeta.length ? `Boş: ${gaps.missingMeta.map((m) => META_LABELS[m]).join(', ')}` : '',
          gaps.invalidDates ? 'Geçerlilik tarihi değerlendirme tarihinden önce' : '',
          gaps.emptySignatories ? `${gaps.emptySignatories} imzacının adı boş` : '',
        ]
          .filter(Boolean)
          .join(' · ')}
      </Button>
    </section>
  {/if}
  {@render group('Olasılık ya da şiddet puanı boş satırlar', gaps.unscored, 'satır', openRisks)}
  {@render group('Yüksek/tolere edilemez riskte önlem ya da sorumlu boş', gaps.missingAction, 'satır', openRisks)}
  {@render group('Tehlike ve risk alanı boş satırlar', gaps.emptyHazard, 'satır', openRisks)}
  {@render group('Tamamlandı ama önlem sonrası puanı yok', gaps.doneWithoutAfter, 'satır', openRisks)}
  {#if gaps.noWithoutRow.length}
    <details class="group">
      {@render summary('Risk tablosuna aktarılmamış eksikler', gaps.noWithoutRow)}
      {@render entries(gaps.noWithoutRow, 'eksik', openUntransferred)}
      <Button variant="outline" size="sm" class="mt-1" disabled={untransferred === 0} onclick={() => go(() => store.transferMissing())}>Tüm eksikleri aktar ({untransferred})</Button>
    </details>
  {/if}
  {@render group('Eksiği giderilmiş (Evet olmuş) ama açık satırlar', gaps.sourceNowYes, 'satır', openRisks)}
  {@render group('Cevaplanmamış kontrol listesi maddeleri', gaps.unanswered, 'madde', openUnanswered)}
</div>
