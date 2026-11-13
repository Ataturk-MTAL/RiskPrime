<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import * as Table from '$lib/components/ui/table';
  import { formatTimeRange } from '$lib/lock-format';
  import { errorMessage, lock, type AuditRow } from '$lib/lock.svelte';
  import { store } from '$lib/state.svelte';
  import { periodKey } from '$lib/storage/types';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let onlyThisPeriod = $state(false);
  let rows = $state<AuditRow[]>([]);
  let error = $state('');
  let loading = $state(false);

  const openId = $derived(periodKey(store.assessment.period, store.assessment.meta.revision));

  /** Period label for a row: the archive's name and revision when known, else the raw id. */
  const periodLabel = (id: string | null) => {
    if (!id) return '';
    const item = store.periods.find((p) => p.id === id);
    return item ? `${item.period.trim() || 'Adsız dönem'} · Rev. ${item.revision}` : id;
  };

  // Reloads on open and whenever the filter flips; a stale answer never overwrites a newer one.
  $effect(() => {
    if (!open) return;
    const periodId = onlyThisPeriod ? openId : null;
    let isStale = false;
    loading = true;
    error = '';
    lock
      .auditList(periodId)
      .then((list) => {
        if (!isStale) rows = list;
      })
      .catch((e) => {
        if (!isStale) error = errorMessage(e);
      })
      .finally(() => {
        if (!isStale) loading = false;
      });
    return () => (isStale = true);
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
    <Dialog.Header>
      <Dialog.Title>Değişiklik geçmişi</Dialog.Title>
      <Dialog.Description>Son 200 işlem, en yenisi üstte.</Dialog.Description>
    </Dialog.Header>
    <Label class="gap-2 font-normal"><Checkbox bind:checked={onlyThisPeriod} />Yalnız bu dönem</Label>
    <div aria-live="polite" class="text-sm text-destructive">{#if error}<p role="alert">{error}</p>{/if}</div>
    {#if loading && rows.length === 0}
      <p class="text-sm text-muted-foreground">Yükleniyor…</p>
    {:else if !error && rows.length === 0}
      <p class="text-sm text-muted-foreground">Kayıtlı işlem yok.</p>
    {:else}
      <div class="max-h-[60vh] overflow-auto rounded-lg border">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Tarih-saat</Table.Head>
              <Table.Head>Kullanıcı</Table.Head>
              <Table.Head>İşlem</Table.Head>
              <Table.Head>Dönem</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rows as row (row.id)}
              <Table.Row>
                <Table.Cell class="whitespace-nowrap">{formatTimeRange(row.startedAt, row.at)}</Table.Cell>
                <Table.Cell>{row.userName}</Table.Cell>
                <Table.Cell class="whitespace-normal">
                  {row.action}{#if row.detail}<span class="block text-xs text-muted-foreground">{row.detail}</span>{/if}
                </Table.Cell>
                <Table.Cell class="whitespace-normal">{periodLabel(row.periodId)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
