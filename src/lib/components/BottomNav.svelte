<script lang="ts">
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { nav } from '$lib/nav.svelte';
  import { isSectionActive, SECTION_ITEMS, sectionBadges } from '$lib/nav-items';
  import { store } from '$lib/state.svelte';

  const badges = $derived(sectionBadges(store.assessment));
</script>

<nav
  aria-label="Bölümler"
  class="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
>
  <ul class="grid" style="grid-template-columns: repeat({SECTION_ITEMS.length}, minmax(0, 1fr))">
    {#each SECTION_ITEMS as item (item.section)}
      {@const count = item.section === 'register' ? badges.register : 0}
      {@const active = isSectionActive(item.section, nav.section)}
      <li>
        <button
          type="button"
          aria-current={active ? 'page' : undefined}
          class="relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset {active ? 'text-primary' : 'text-muted-foreground'}"
          onclick={() => nav.go(item.section)}
        >
          <item.icon class="size-5" aria-hidden="true" />
          <span class="max-w-full truncate">{item.label}</span>
          {#if count > 0}
            <span class="absolute top-1 left-1/2 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white tabular-nums">{count}<span class="sr-only"> yüksek ve tolere edilemez açık risk</span></span>
          {:else if item.section === 'report' && badges.reportGaps}
            <TriangleAlert class="absolute top-1 left-1/2 ml-2 size-3.5 text-destructive" aria-hidden="true" /><span class="sr-only">Eksik bilgi var</span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</nav>
