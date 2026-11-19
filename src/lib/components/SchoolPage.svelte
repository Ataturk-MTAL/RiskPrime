<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import EmptyState from './EmptyState.svelte';
  import InspectionEditor from './InspectionEditor.svelte';
  import PageHeader from './PageHeader.svelte';
  import SchoolCard from './SchoolCard.svelte';
  import { INTERACTIVE_ROW, SECTION_TITLE } from './shared-classes';
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
      <ul class="divide-y rounded-md border">
        {#each schoolWideLists as item (item.list.id)}
          {@const isOpen = openWideId === item.list.id}
          <li>
            <Collapsible.Root open={isOpen} onOpenChange={(o) => (openWideId = o ? item.list.id : null)}>
              <Collapsible.Trigger class="{INTERACTIVE_ROW} flex min-h-11 w-full items-center justify-between gap-2 p-3 text-left">
                <span class="min-w-0 font-medium">{item.list.code} {item.list.name}</span>
                <span class="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  {item.answered}/{item.total}{#if item.no}{' '}· <b class="text-deficiency">{item.no} eksik</b>{/if}
                  <ChevronDown class="size-4 transition-transform duration-200 motion-reduce:transition-none {isOpen ? 'rotate-180' : ''}" aria-hidden="true" />
                </span>
              </Collapsible.Trigger>
              <Collapsible.Content class="overflow-hidden data-open:animate-collapsible-down motion-reduce:data-open:animate-none border-t p-3">
                {#if isOpen}<InspectionEditor listId={item.list.id} locationId={null} />{/if}
              </Collapsible.Content>
            </Collapsible.Root>
          </li>
        {/each}
      </ul>
    {:else}
      <EmptyState icon={ListChecks} text="Okul genelinde doldurulan liste yok." />
    {/if}
  </section>
</div>
