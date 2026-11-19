<script lang="ts">
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Table from '$lib/components/ui/table';
  import LevelBadge from './LevelBadge.svelte';
  import SelectField from './SelectField.svelte';
  import { isOverdue, STATUS_LABELS } from '$lib/domain/assessment';
  import { filterRegister, LEVEL_ORDER, levelCounts } from '$lib/domain/filters';
  import { riskRegister, type RegisterEntry } from '$lib/domain/inspections';
  import { LEVELS } from '$lib/domain/matrix';
  import { nav, type RegisterFilter } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const ALL = 'all';
  const clamp = 'line-clamp-3 whitespace-normal hyphens-auto';
  const today = new Date();

  const a = $derived(store.assessment);
  const filter = $derived(nav.registerFilter);
  const everything = $derived(riskRegister(a));
  const shown = $derived(filterRegister(everything, filter, today));
  const counts = $derived(levelCounts(everything, filter, today));

  const locationOptions = $derived([{ value: ALL, label: 'Tüm mekânlar' }, ...a.locations.map((l) => ({ value: l.id, label: l.name || 'Adsız mekân' }))]);
  const statusOptions = [
    { value: 'all', label: 'Tüm durumlar' },
    { value: 'open', label: STATUS_LABELS.open },
    { value: 'done', label: STATUS_LABELS.done },
  ];

  const patch = (changes: Partial<RegisterFilter>) => (nav.registerFilter = { ...filter, ...changes });
  const reset = () => (nav.registerFilter = { level: 'all', locationId: null, status: 'all', overdue: false, query: '' });
  const isFiltered = $derived(filter.level !== 'all' || filter.locationId !== null || filter.status !== 'all' || filter.overdue || filter.query !== '');
  const open = (e: RegisterEntry) => nav.openRow(e.locationId, e.row.id);
</script>

{#snippet overdueBadge(e: RegisterEntry)}
  {#if isOverdue(e.row, today)}<Badge variant="destructive" class="mt-1"><CircleAlert aria-hidden="true" />Süresi geçti</Badge>{/if}
{/snippet}

<div class="mx-auto w-full max-w-6xl space-y-4 p-4">
  <h1 class="text-xl font-semibold">Riskler</h1>

  <div class="flex flex-wrap items-center gap-2">
    <Button variant={filter.level === 'all' ? 'default' : 'outline'} size="sm" aria-pressed={filter.level === 'all'} onclick={() => patch({ level: 'all' })}>Tümü ({counts.all})</Button>
    <Button variant={filter.level === 'serious' ? 'default' : 'outline'} size="sm" aria-pressed={filter.level === 'serious'} onclick={() => patch({ level: 'serious' })}>Yüksek ve tolere edilemez ({counts.serious})</Button>
    <span class="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true"></span>
    {#each LEVEL_ORDER as key (key)}
      <Badge class="h-auto min-h-5 whitespace-normal leading-tight" style="background:{LEVELS[key].background};color:{LEVELS[key].text}">{LEVELS[key].label}: {counts[key]}</Badge>
    {/each}
    <Badge variant="outline">Puansız: {counts.unscored}</Badge>
  </div>

  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto]">
    <SelectField label="Mekân" options={locationOptions} value={filter.locationId ?? ALL} onValueChange={(v) => patch({ locationId: v === ALL ? null : v })} />
    <SelectField label="Durum" options={statusOptions} value={filter.status} onValueChange={(v) => patch({ status: v as RegisterFilter['status'] })} />
    <Input type="search" aria-label="Risklerde ara" placeholder="Ara…" value={filter.query} oninput={(e) => patch({ query: e.currentTarget.value })} />
    <Label class="flex min-h-9 items-center gap-2 text-sm">
      <Checkbox checked={filter.overdue} onCheckedChange={(v) => patch({ overdue: v === true })} />Süresi geçmiş
    </Label>
  </div>

  {#if !shown.length}
    <div class="space-y-3 rounded-lg border border-dashed p-6 text-center">
      {#if everything.length}
        <p class="text-sm text-muted-foreground">Bu süzgece uyan risk satırı yok.</p>
        {#if isFiltered}<Button variant="outline" size="sm" onclick={reset}>Süzgeçleri temizle</Button>{/if}
      {:else}
        <p class="text-sm text-muted-foreground">Henüz risk satırı yok.</p>
        <Button variant="outline" size="sm" onclick={() => nav.go('deficiencies')}>Eksiklere git</Button>
      {/if}
    </div>
  {:else}
    <div class="hidden md:block">
      <Table.Root class="table-fixed">
        <Table.Header class="[&_th]:whitespace-normal [&_th]:text-xs [&_th]:text-muted-foreground">
          <Table.Row class="hover:bg-transparent">
            <Table.Head class="w-10">No</Table.Head>
            <Table.Head class="w-[12%]">Mekân</Table.Head>
            <Table.Head class="w-[14%]">Alet / ekipman</Table.Head>
            <Table.Head class="w-[24%]">Tehlike</Table.Head>
            <Table.Head class="w-9 px-1">O</Table.Head>
            <Table.Head class="w-9 px-1">Ş</Table.Head>
            <Table.Head class="w-24">Düzey</Table.Head>
            <Table.Head class="w-[12%]">Sorumlu</Table.Head>
            <Table.Head class="w-24">Bitiş</Table.Head>
            <Table.Head class="w-24">Durum</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each shown as e (e.locationId + e.row.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
            <Table.Row class="cursor-pointer align-top" onclick={() => open(e)}>
              <Table.Cell class="border-l-4 font-semibold text-muted-foreground" style="border-left-color:{e.level?.background ?? 'transparent'}">
                <button type="button" class="focus-visible:underline" aria-label="{e.locationName} satır {e.number} düzenle" onclick={(ev) => { ev.stopPropagation(); open(e); }}>{e.number}</button>
              </Table.Cell>
              <Table.Cell><div class={clamp} title={e.locationName}>{e.locationName}</div></Table.Cell>
              <Table.Cell class="font-medium"><div class={clamp} title={e.row.equipment}>{e.row.equipment}</div></Table.Cell>
              <Table.Cell><div class={clamp} title={e.row.hazard}>{e.row.hazard}</div></Table.Cell>
              <Table.Cell class="px-1">{e.row.likelihood ?? '—'}</Table.Cell>
              <Table.Cell class="px-1">{e.row.severity ?? '—'}</Table.Cell>
              <Table.Cell><LevelBadge likelihood={e.row.likelihood} severity={e.row.severity} /></Table.Cell>
              <Table.Cell><div class={clamp} title={e.row.responsible}>{e.row.responsible}</div></Table.Cell>
              <Table.Cell class="whitespace-normal">{e.row.dueDate || '—'}</Table.Cell>
              <Table.Cell>{STATUS_LABELS[e.row.status]}{@render overdueBadge(e)}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>

    <div class="space-y-2 md:hidden">
      {#each shown as e (e.locationId + e.row.id)}
        <article class="rounded-lg border border-l-4 bg-background" style:border-left-color={e.level?.background}>
          <button type="button" class="block min-h-11 w-full space-y-1 rounded-lg p-3 text-left hover:bg-muted" aria-label="{e.locationName} satır {e.number} düzenle" onclick={() => open(e)}>
            <span class="block text-xs text-muted-foreground">{e.locationName} · #{e.number}</span>
            <span class="line-clamp-1 block text-sm font-semibold">{e.row.equipment || 'Ekipman girilmedi'}</span>
            <span class="line-clamp-2 block text-sm text-muted-foreground">{e.row.hazard || 'Tehlike girilmedi'}</span>
            <span class="flex flex-wrap items-center gap-2 pt-1">
              <LevelBadge likelihood={e.row.likelihood} severity={e.row.severity} />
              <span class="text-xs text-muted-foreground">{STATUS_LABELS[e.row.status]}{e.row.dueDate ? ` · ${e.row.dueDate}` : ''}{e.row.responsible ? ` · ${e.row.responsible}` : ''}</span>
              {@render overdueBadge(e)}
            </span>
          </button>
        </article>
      {/each}
    </div>
  {/if}
</div>
