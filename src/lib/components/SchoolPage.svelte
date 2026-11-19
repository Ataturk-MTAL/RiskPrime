<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import InspectionEditor from './InspectionEditor.svelte';
  import PageHeader from './PageHeader.svelte';
  import SchoolCard from './SchoolCard.svelte';
  import { SECTION_TITLE } from './shared-classes';
  import { inspectionSummary, inspectionsForList } from '$lib/domain/inspections';
  import { store } from '$lib/state.svelte';

  const a = $derived(store.assessment);
  /** School-wide list whose inspection is open for answering. */
  let openWideId = $state<string | null>(null);
  const schoolWideLists = $derived(
    a.checklists.flatMap((list) =>
      inspectionsForList(a, list.id)
        .filter((i) => i.locationId === null)
        .map((i) => ({ list, ...inspectionSummary(a, i) })),
    ),
  );
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
  <PageHeader title="Okul" />
  <SchoolCard />
  <section class="flex flex-col gap-3" aria-labelledby="school-wide">
    <h2 id="school-wide" class={SECTION_TITLE}>Okul geneli kontrol listeleri</h2>
    {#if schoolWideLists.length}
      <ul class="flex flex-col gap-1 text-sm">
        {#each schoolWideLists as item (item.list.id)}
          <li>
            <Button
              variant="link"
              class="h-auto p-0 text-left whitespace-normal"
              aria-expanded={openWideId === item.list.id}
              onclick={() => (openWideId = openWideId === item.list.id ? null : item.list.id)}
            >
              {item.list.code} {item.list.name}
            </Button>
            <span class="text-muted-foreground">: {item.answered}/{item.total} madde yanıtlandı{item.no ? `, ${item.no} eksik` : ''}</span>
            {#if openWideId === item.list.id}
              <div class="mt-3 rounded-lg border p-3"><InspectionEditor listId={item.list.id} locationId={null} /></div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-muted-foreground">Okul genelinde denetlenen liste yok.</p>
    {/if}
  </section>
</div>
