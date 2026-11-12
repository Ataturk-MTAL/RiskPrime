<script lang="ts">
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleDashed from '@lucide/svelte/icons/circle-dashed';
  import CircleDot from '@lucide/svelte/icons/circle-dot';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { Separator } from '$lib/components/ui/separator';
  import { LEVELS, type LevelKey } from '$lib/domain/matrix';
  import { progress, type StepState } from '$lib/domain/progress';
  import { store, type Tab } from '$lib/state.svelte';

  const STATES: Record<StepState, { label: string; icon: typeof CircleCheck }> = {
    done: { label: 'Tamam', icon: CircleCheck },
    doing: { label: 'Devam ediyor', icon: CircleDot },
    todo: { label: 'Başlanmadı', icon: CircleDashed },
  };
  const LEVEL_ORDER: LevelKey[] = ['intolerable', 'high', 'medium', 'low', 'negligible'];

  const p = $derived(progress(store.assessment, new Date()));
  const percent = (done: number, total: number) => (total ? Math.round((100 * done) / total) : 0);
  // The first unfinished step is the one to do next (-1 when all are done).
  const nextIndex = $derived([p.school, p.checklists, p.risk, p.readiness].findIndex((s) => s.state !== 'done'));
  const goTo = (tab: Tab) => (store.tab = tab);

  const steps = $derived([
    {
      title: 'Okul bilgileri',
      state: p.school.state,
      text: 'Okul adı, dönem, tarihler ve imza sahipleri belgenin başında yer alır.',
      value: percent(p.school.metaFilled + p.school.signatoriesFilled, p.school.metaTotal + p.school.signatoriesTotal),
      facts: [
        `Bilgi alanı: ${p.school.metaFilled}/${p.school.metaTotal} dolu`,
        `İmza sahibi: ${p.school.signatoriesFilled}/${p.school.signatoriesTotal} ad yazılı`,
      ],
      extra: null as { label: string; run: () => void } | null,
      action: { label: 'Okul bilgilerini düzenle', run: () => { goTo('school'); store.openSchool(); } },
    },
    {
      title: 'Kontrol listeleri',
      state: p.checklists.state,
      text: 'Maddeleri Evet / Hayır / U.D. diye yanıtlayın; Hayır dediğiniz her madde bir eksiktir.',
      value: percent(p.checklists.answered, p.checklists.total),
      facts: [
        `Yanıtlanan madde: ${p.checklists.answered}/${p.checklists.total}`,
        `Eksik (Hayır): ${p.checklists.missing}`,
        `Tamamlanan liste: ${p.checklists.listsDone}/${p.checklists.listsTotal}`,
      ],
      extra: null as { label: string; run: () => void } | null,
      action: {
        label: 'Listeye git',
        run: () => {
          const id = p.checklists.firstIncompleteId ?? store.assessment.checklists[0]?.id;
          if (id) store.selectChecklist(id);
          else goTo('checklists');
        },
      },
    },
    {
      title: 'Risk tablosu',
      state: p.risk.state,
      text: 'Eksikleri risk satırına aktarın, olasılık ve şiddet puanı verin, önlem ve sorumlu atayın.',
      value: percent(p.risk.scored, p.risk.total),
      facts: [
        `Aktarılmamış eksik: ${p.risk.untransferred}`,
        `Puanlanan satır: ${p.risk.scored}/${p.risk.total}`,
        `Yüksek ve tolere edilemez: ${p.risk.serious}`,
        `Süresi geçen: ${p.risk.overdue}`,
      ],
      extra: p.risk.untransferred
        ? { label: `Eksikleri aktar (${p.risk.untransferred})`, run: () => store.transferMissing() }
        : null,
      action: {
        label: 'Puanlamaya devam et',
        run: () => {
          const id = p.risk.firstUnscoredLocationId ?? store.assessment.locations[0]?.id;
          if (id) store.selectLocation(id);
          else goTo('risk');
        },
      },
    },
    {
      title: 'Hazırlık ve PDF',
      state: p.readiness.state,
      text: 'PDF almadan önce eksik kalan alanları kontrol edin.',
      value: p.readiness.hasGaps ? 0 : 100,
      facts: [p.readiness.hasGaps ? `PDF öncesi ${p.readiness.gapCount} açık nokta var` : 'Açık nokta yok'],
      extra: { label: 'Açık noktaları gör', run: () => goTo('readiness') },
      action: { label: 'PDF indir', run: () => store.requestFullPdf() },
    },
  ]);
</script>

<div class="flex flex-col gap-6 p-4">
  <h1 class="text-2xl font-semibold">Genel bakış</h1>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {#each steps as step, i (step.title)}
      {@const info = STATES[step.state]}
      {@const isNext = nextIndex === i}
      <Card.Root class={isNext ? 'ring-2 ring-primary' : ''}>
        <Card.Header>
          <Card.Description>Adım {i + 1}{isNext ? ' · Sıradaki' : ''}</Card.Description>
          <Card.Title>{step.title}</Card.Title>
          <Card.Action>
            <Badge variant={step.state === 'done' ? 'default' : 'secondary'} class="gap-1">
              <info.icon aria-hidden="true" class="size-3" />{info.label}
            </Badge>
          </Card.Action>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
          <p class="text-sm text-muted-foreground">{step.text}</p>
          <Progress value={step.value} aria-label="{step.title} ilerleme" />
          <ul class="text-sm">
            {#each step.facts as fact (fact)}<li>{fact}</li>{/each}
          </ul>
        </Card.Content>
        <Card.Footer class="flex flex-wrap gap-2">
          <Button variant={isNext ? 'default' : 'outline'} onclick={step.action.run}>{step.action.label}</Button>
          {#if step.extra}
            <Button variant="outline" onclick={step.extra.run}>{step.extra.label}</Button>
          {/if}
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>

  <Separator />

  <section class="flex flex-col gap-3" aria-labelledby="level-summary">
    <h2 id="level-summary" class="text-lg font-medium">Risk düzeyleri ({p.risk.scored} puanlı satır)</h2>
    <ul class="flex flex-wrap gap-3">
      {#each LEVEL_ORDER as key (key)}
        <li class="flex items-center gap-2">
          <Badge style="background:{LEVELS[key].background};color:{LEVELS[key].text}">{LEVELS[key].label}</Badge>
          <span class="text-sm font-medium">{p.levels[key]}</span>
        </li>
      {/each}
    </ul>
  </section>
</div>
