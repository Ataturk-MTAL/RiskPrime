<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import { Button } from '$lib/components/ui/button';
  import { summary } from '$lib/domain/checklist';
  import { store } from '$lib/state.svelte';
</script>

<aside class="space-y-3 rounded-xl border bg-card p-3 md:sticky md:top-4">
  <h2 class="font-semibold">Kontrol listeleri</h2>
  <ul class="space-y-0.5">
    {#each store.assessment.checklists as list (list.id)}
      {@const s = summary(list)}
      <li>
        <button
          type="button"
          aria-current={list.id === store.checklistId}
          class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
          onclick={() => store.selectChecklist(list.id)}
        >
          <span class="min-w-0">{#if list.code}<b>{list.code}</b>{' '}{/if}{list.name}</span>
          <span class="flex shrink-0 items-center gap-1 text-xs">
            {#if s.no}<span class="rounded-full bg-red-600 px-1.5 py-0.5 text-white" title="Hayır cevabı">{s.no}</span>{/if}
            <span class="opacity-70">{s.answered}/{s.total}</span>
          </span>
        </button>
      </li>
    {:else}
      <p class="text-sm text-muted-foreground">Henüz kontrol listesi yok. "+ Hazır formdan ekle" ile MEB ya da elektrik-elektronik listelerini ekleyin.</p>
    {/each}
  </ul>
  <Button variant="outline" class="w-full" onclick={() => store.addBlankChecklist()}><Plus />Boş liste ekle</Button>
</aside>
