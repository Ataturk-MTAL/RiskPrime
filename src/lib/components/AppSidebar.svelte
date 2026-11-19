<script lang="ts">
  import Info from '@lucide/svelte/icons/info';
  import Library from '@lucide/svelte/icons/library';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { nav } from '$lib/nav.svelte';
  import { isSectionActive, SECTION_ITEMS, sectionBadges } from '$lib/nav-items';
  import { store } from '$lib/state.svelte';

  let { onAbout }: { onAbout: () => void } = $props();

  const badges = $derived(sectionBadges(store.assessment));
  const schoolLine = $derived(
    [store.assessment.school.name, store.assessment.school.scope]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' · '),
  );
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" tooltipContent="RiskPrime" onclick={() => nav.go('overview')}>
          <img src="{import.meta.env.BASE_URL}logo.png" alt="" width="32" height="32" class="size-8 shrink-0" />
          <span class="grid min-w-0 flex-1 text-left leading-tight">
            <span class="truncate font-semibold">RiskPrime</span>
            {#if schoolLine}<span class="truncate text-xs text-muted-foreground">{schoolLine}</span>{/if}
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
            {#each SECTION_ITEMS as item (item.section)}
              {@const count = item.section === 'register' ? badges.register : 0}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={isSectionActive(item.section, nav.section)}
                  aria-current={isSectionActive(item.section, nav.section) ? 'page' : undefined}
                  tooltipContent={item.label}
                  onclick={() => nav.go(item.section)}
                >
                  <item.icon /><span>{item.label}</span>
                </Sidebar.MenuButton>
                {#if count > 0}
                  <Sidebar.MenuBadge>{count}<span class="sr-only"> yüksek ve tolere edilemez açık risk</span></Sidebar.MenuBadge>
                {:else if item.section === 'report' && badges.reportGaps}
                  <Sidebar.MenuBadge><TriangleAlert class="size-3.5 text-deficiency" aria-hidden="true" /><span class="sr-only">Eksik bilgi var</span></Sidebar.MenuBadge>
                {/if}
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </nav>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          isActive={nav.section === 'library'}
          aria-current={nav.section === 'library' ? 'page' : undefined}
          tooltipContent="Kütüphane"
          onclick={() => nav.openLibrary()}
        >
          <Library /><span>Kütüphane</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton tooltipContent="Hakkında" onclick={onAbout}>
          <Info /><span>Hakkında</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
