<script lang="ts">
  import LocationDetail from './LocationDetail.svelte';
  import LocationList from './LocationList.svelte';
  import { nav } from '$lib/nav.svelte';
  import { store } from '$lib/state.svelte';

  const loc = $derived(store.assessment.locations.find((l) => l.id === nav.place.locationId));
</script>

{#if loc}
  {#key loc.id}<LocationDetail location={loc} />{/key}
{:else}
  <LocationList />
{/if}
