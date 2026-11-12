<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import House from '@lucide/svelte/icons/house';
  import Info from '@lucide/svelte/icons/info';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import Plus from '@lucide/svelte/icons/plus';
  import School from '@lucide/svelte/icons/school';
  import Table2 from '@lucide/svelte/icons/table-2';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { Badge } from '$lib/components/ui/badge';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import AboutDialog from './AboutDialog.svelte';
  import LibraryDialog from './LibraryDialog.svelte';
  import NewLocationDialog from './NewLocationDialog.svelte';
  import { grouped, isOverdue } from '$lib/domain/assessment';
  import { summary } from '$lib/domain/checklist';
  import { isScore } from '$lib/domain/matrix';
  import { readiness } from '$lib/domain/readiness';
  import type { Location } from '$lib/domain/types';
  import { store, type Tab } from '$lib/state.svelte';

  const sidebar = Sidebar.useSidebar();

  let checklistsOpen = $state(true);
  let locationsOpen = $state(true);
  let libraryOpen = $state(false);
  let newLocationOpen = $state(false);
  let aboutOpen = $state(false);

  const groups = $derived(grouped(store.assessment));
  const missingMeta = $derived(readiness(store.assessment).missingMeta.length > 0);
  const signatories = $derived(store.assessment.school.signatories);
  const signedCount = $derived(signatories.filter((s) => s.name).length);
  const today = new Date();
  const scoredCount = (loc: Location) => loc.rows.filter((r) => isScore(r.likelihood) && isScore(r.severity)).length;
  const hasOverdue = (loc: Location) => loc.rows.some((r) => isOverdue(r, today));

  /** Runs a navigation and closes the mobile drawer. */
  function go(action: () => void) {
    action();
    if (sidebar.isMobile) sidebar.setOpenMobile(false);
  }
  const goTab = (tab: Tab) => go(() => (store.tab = tab));
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" tooltipContent="RiskPrime" onclick={() => goTab('overview')}>
          <img src="{import.meta.env.BASE_URL}logo.png" alt="" width="32" height="32" class="size-8 shrink-0" />
          <span class="grid min-w-0 flex-1 text-left leading-tight">
            <span class="truncate font-semibold">RiskPrime</span>
            <span class="truncate text-xs text-muted-foreground">Mersin Atatürk MTAL · Elektrik-Elektronik</span>
          </span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <nav aria-label="Bölümler">
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={store.tab === 'overview'} tooltipContent="Genel bakış" onclick={() => goTab('overview')}>
                <House /><span>Genel bakış</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={store.tab === 'school'} tooltipContent="Okul bilgileri" onclick={() => goTab('school')}>
                <School /><span>Okul bilgileri</span>
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>
                {#if missingMeta}<TriangleAlert class="size-3.5 text-destructive" aria-hidden="true" /><span class="sr-only">Eksik bilgi var</span>{:else}{signedCount}/{signatories.length} imzacı{/if}
              </Sidebar.MenuBadge>
            </Sidebar.MenuItem>

            <Collapsible.Root bind:open={checklistsOpen}>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={store.tab === 'checklists'}
                  tooltipContent="1. Kontrol listeleri"
                  aria-expanded={checklistsOpen}
                  onclick={() => go(() => { checklistsOpen = !checklistsOpen || store.tab !== 'checklists'; store.tab = 'checklists'; })}
                >
                  <ListChecks /><span>1. Kontrol listeleri</span>
                  <ChevronRight class="ml-auto transition-transform {checklistsOpen ? 'rotate-90' : ''}" aria-hidden="true" />
                </Sidebar.MenuButton>
                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each store.assessment.checklists as list (list.id)}
                      {@const s = summary(list)}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton class="w-full" isActive={store.tab === 'checklists' && list.id === store.checklistId}>
                          {#snippet child({ props })}
                            <button type="button" {...props} onclick={() => go(() => store.selectChecklist(list.id))}>
                              <span class="min-w-0 flex-1 truncate text-left">{list.code ? `${list.code} · ` : ''}{list.name}</span>
                              {#if s.no}
                                <Badge variant="destructive">{s.no} eksik</Badge>
                              {:else}
                                <Badge variant="secondary">{s.answered}/{s.total}</Badge>
                              {/if}
                            </button>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    {:else}
                      <li class="px-2 py-1 text-xs text-muted-foreground">Henüz kontrol listesi yok.</li>
                    {/each}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton class="w-full">
                        {#snippet child({ props })}
                          <button type="button" {...props} onclick={() => go(() => store.addBlankChecklist())}><Plus /><span>Liste ekle</span></button>
                        {/snippet}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton class="w-full">
                        {#snippet child({ props })}
                          <button type="button" {...props} onclick={() => go(() => (libraryOpen = true))}><Plus /><span>Bankadan / hazır formdan ekle</span></button>
                        {/snippet}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  </Sidebar.MenuSub>
                </Collapsible.Content>
              </Sidebar.MenuItem>
            </Collapsible.Root>

            <Collapsible.Root bind:open={locationsOpen}>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={store.tab === 'risk'}
                  tooltipContent="2. Risk tablosu"
                  aria-expanded={locationsOpen}
                  onclick={() => go(() => { locationsOpen = !locationsOpen || store.tab !== 'risk'; store.tab = 'risk'; })}
                >
                  <Table2 /><span>2. Risk tablosu</span>
                  <ChevronRight class="ml-auto transition-transform {locationsOpen ? 'rotate-90' : ''}" aria-hidden="true" />
                </Sidebar.MenuButton>
                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each groups as group (group.title)}
                      {#if group.title}<li class="px-2 pt-1 text-xs font-medium text-muted-foreground">{group.title}</li>{/if}
                      {#each group.locations as loc (loc.id)}
                        <Sidebar.MenuSubItem>
                          <Sidebar.MenuSubButton class="w-full" isActive={store.tab === 'risk' && loc.id === store.locationId}>
                            {#snippet child({ props })}
                              <button type="button" {...props} onclick={() => go(() => store.selectLocation(loc.id))}>
                                <span class="min-w-0 flex-1 truncate text-left">{loc.name || 'Adsız mekân'}</span>
                                {#if hasOverdue(loc)}<TriangleAlert class="size-3.5 text-destructive" aria-hidden="true" /><span class="sr-only">süresi geçmiş satır var</span>{/if}
                                <Badge variant="secondary">{scoredCount(loc)}/{loc.rows.length}</Badge>
                              </button>
                            {/snippet}
                          </Sidebar.MenuSubButton>
                        </Sidebar.MenuSubItem>
                      {/each}
                    {:else}
                      <li class="px-2 py-1 text-xs text-muted-foreground">Henüz mekân yok.</li>
                    {/each}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton class="w-full">
                        {#snippet child({ props })}
                          <button type="button" {...props} onclick={() => go(() => (newLocationOpen = true))}><Plus /><span>Mekân ekle</span></button>
                        {/snippet}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  </Sidebar.MenuSub>
                </Collapsible.Content>
              </Sidebar.MenuItem>
            </Collapsible.Root>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={store.tab === 'readiness'} tooltipContent="Hazırlık ve PDF" onclick={() => goTab('readiness')}>
                <ClipboardCheck /><span>Hazırlık ve PDF</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </nav>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton tooltipContent="Hakkında" onclick={() => go(() => (aboutOpen = true))}>
          <Info /><span>Hakkında</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>

<LibraryDialog bind:open={libraryOpen} />
<NewLocationDialog bind:open={newLocationOpen} />
<AboutDialog bind:open={aboutOpen} />
