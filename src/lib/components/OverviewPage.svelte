<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { progress, type StepState } from '$lib/domain/progress';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const STATES: Record<StepState, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    done: { label: 'Tamamlandı', variant: 'default' },
    doing: { label: 'Devam ediyor', variant: 'secondary' },
    todo: { label: 'Başlanmadı', variant: 'outline' },
    blocked: { label: 'Henüz başlanamaz', variant: 'outline' },
  };

  const p = $derived(progress(store.assessment, new Date()));
  const validUntil = $derived(store.assessment.validUntil.trim() || 'girilmedi');

  const tasks = $derived([
    {
      title: 'Okul bilgilerini girin',
      state: p.school.state,
      detail: `Bilgi ${p.school.metaFilled}/${p.school.metaTotal}, imzacı ${p.school.signatoriesFilled}/${p.school.signatoriesTotal} dolu`,
      run: () => nav.openReport(true),
    },
    {
      title: 'Mekânları denetleyin',
      state: p.checklists.state,
      detail: `${p.checklists.answered}/${p.checklists.total} madde yanıtlandı, ${p.checklists.missing} eksik`,
      run: () => nav.go('locations'),
    },
    {
      title: 'Eksikleri risk tablosuna aktarın',
      state: p.transfer.state,
      detail: `${p.transfer.untransferred} aktarılmamış eksik`,
      run: () => nav.openDeficiencies({ state: 'untransferred' }),
    },
    {
      title: 'Riskleri puanlayın',
      state: p.risk.state,
      detail: `${p.risk.scored}/${p.risk.total} satır puanlandı`,
      run: () => (p.risk.firstUnscoredLocationId ? nav.openLocation(p.risk.firstUnscoredLocationId, 'risk') : nav.openRegister()),
    },
    {
      title: 'Gözden geçirin ve imzalayın',
      state: p.readiness.state,
      detail: p.readiness.hasGaps ? `İmza öncesi ${p.readiness.gapCount} açık nokta` : 'Açık nokta yok',
      run: () => nav.go('report'),
    },
  ]);

  const tiles = $derived([
    { label: 'Yüksek/tolere edilemez açık riskler', value: String(p.risk.openSerious), run: () => nav.openRegister({ level: 'serious', status: 'open' }) },
    { label: 'Süresi geçmiş', value: String(p.risk.overdue), run: () => nav.openRegister({ overdue: true }) },
    { label: 'Aktarılmamış eksik', value: String(p.transfer.untransferred), run: () => nav.openDeficiencies({ state: 'untransferred' }) },
    { label: 'Geçerlilik', value: validUntil, run: () => nav.openReport(true) },
  ]);
</script>

<div class="flex flex-col gap-6 p-4">
  <div class="flex max-w-2xl flex-col gap-2">
    <h1 class="text-2xl font-semibold">Genel bakış</h1>
    <p class="text-sm text-muted-foreground">
      Yıllık risk değerlendirmesi beş adımda hazırlanır. Sırayla ilerleyin; her adımın durumu burada görünür.
    </p>
  </div>

  <ol class="flex max-w-2xl flex-col divide-y rounded-xl border bg-card" aria-label="Yıllık değerlendirme adımları">
    {#each tasks as task, i (task.title)}
      {@const info = STATES[task.state]}
      <li class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4">
        <div class="flex min-w-0 flex-col items-start">
          <Button variant="link" class="h-auto p-0 text-left text-base whitespace-normal" onclick={task.run}>
            {i + 1}. {task.title}
          </Button>
          <span class="text-sm text-muted-foreground">{task.detail}</span>
        </div>
        <Badge variant={info.variant}>{info.label}</Badge>
      </li>
    {/each}
  </ol>

  <section class="flex flex-col gap-3" aria-labelledby="quick-links">
    <h2 id="quick-links" class="text-lg font-medium">Dikkat edilecekler</h2>
    <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
</div>
