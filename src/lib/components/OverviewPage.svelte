<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { nextStep, progress, type StepKey } from '$lib/domain/progress';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';
  import { INTERACTIVE_ROW } from './shared-classes';

  const p = $derived(progress(store.assessment, new Date()));
  const next = $derived(nextStep(p));
  const periodLine = $derived(
    `Dönem ${store.assessment.period.trim() || 'girilmedi'} · Revizyon ${store.assessment.meta.revision} · ${store.assessment.meta.status === 'signed' ? 'İmzalandı' : 'Taslak'}`,
  );
  const validUntil = $derived(store.assessment.validUntil.trim());

  const tasks = $derived<{ key: StepKey; title: string; detail: string; run: () => void }[]>([
    {
      key: 'school',
      title: 'Okul bilgilerini girin',
      detail: `Bilgi ${p.school.metaFilled}/${p.school.metaTotal}, imzacı ${p.school.signatoriesFilled}/${p.school.signatoriesTotal} dolu`,
      run: () => nav.openReport(true),
    },
    {
      key: 'checklists',
      title: 'Mekânları denetleyin',
      detail: `${p.checklists.answered}/${p.checklists.total} madde yanıtlandı, ${p.checklists.missing} eksik`,
      run: () => nav.go('locations'),
    },
    {
      key: 'transfer',
      title: 'Eksikleri risk tablosuna aktarın',
      detail: `${p.transfer.untransferred} aktarılmamış eksik`,
      run: () => nav.openDeficiencies({ state: 'untransferred' }),
    },
    {
      key: 'risk',
      title: 'Riskleri puanlayın',
      detail: `${p.risk.scored}/${p.risk.total} satır puanlandı`,
      run: () => nav.openRegister({ level: 'unscored' }),
    },
    {
      key: 'readiness',
      title: 'Gözden geçirin ve imzalayın',
      detail: p.readiness.hasGaps ? 'Açık noktaları Rapor sayfasında görün' : 'Açık nokta yok',
      run: () => nav.go('report'),
    },
  ]);

  // Counters only when they lead somewhere: zero tiles are hidden.
  const tiles = $derived(
    [
      { label: 'Yüksek/tolere edilemez açık riskler', value: p.risk.openSerious, run: () => nav.openRegister({ level: 'serious', status: 'open' }) },
      { label: 'Süresi geçmiş', value: p.risk.overdue, run: () => nav.openRegister({ overdue: true }) },
      { label: 'Aktarılmamış eksik', value: p.transfer.untransferred, run: () => nav.openDeficiencies({ state: 'untransferred' }) },
    ].filter((t) => t.value > 0),
  );
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold">Genel bakış</h1>
    <p class="text-sm text-muted-foreground">{periodLine}{validUntil ? ` · Geçerlilik ${validUntil}` : ''}</p>
  </div>

  <ol class="flex flex-col divide-y rounded-xl border bg-card" aria-label="Yıllık değerlendirme adımları">
    {#each tasks as task, i (task.key)}
      {@const isNext = task.key === next}
      {@const isDone = p[task.key].state === 'done'}
      <li>
        <button
          type="button"
          class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center justify-between gap-4 p-4 text-left {isNext ? 'border-l-4 border-l-primary' : ''}"
          aria-current={isNext ? 'step' : undefined}
          onclick={task.run}
        >
          <span class="flex min-w-0 flex-col">
            <span class={isNext ? 'font-semibold' : isDone ? 'text-muted-foreground' : 'font-medium'}>{i + 1}. {task.title}</span>
            <span class="text-sm text-muted-foreground">{task.detail}</span>
          </span>
          {#if isNext}
            <Badge>Sıradaki</Badge>
          {:else if isDone}
            <CircleCheck class="size-4 shrink-0 text-muted-foreground" aria-label="Tamamlandı" />
          {/if}
        </button>
      </li>
    {/each}
  </ol>

  {#if tiles.length}
    <section class="flex flex-col gap-3" aria-labelledby="quick-links">
      <h2 id="quick-links" class="text-lg font-medium">Dikkat edilecekler</h2>
      <ul class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {#each tiles as tile (tile.label)}
          <li>
            <Button variant="outline" class="h-full w-full flex-col items-start gap-1 p-4 whitespace-normal" onclick={tile.run}>
              <span class="text-sm font-normal text-muted-foreground">{tile.label}</span>
              <span class="text-2xl font-semibold">{tile.value}</span>
            </Button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
