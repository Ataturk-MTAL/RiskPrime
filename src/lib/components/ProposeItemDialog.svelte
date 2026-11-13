<script lang="ts" module>
  interface TurnstileApi {
    render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string;
    reset: (id: string) => void;
    remove: (id: string) => void;
  }
  const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  const turnstileApi = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;
  let scriptPromise: Promise<TurnstileApi> | null = null;

  function loadTurnstile(): Promise<TurnstileApi> {
    scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
      const api = turnstileApi();
      if (api) return resolve(api);
      const script = document.createElement('script');
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.onload = () => {
        const loaded = turnstileApi();
        if (loaded) resolve(loaded);
        else reject(new Error('turnstile missing'));
      };
      script.onerror = () => reject(new Error('turnstile failed'));
      document.head.append(script);
    }).catch((e: unknown) => {
      scriptPromise = null;
      throw e;
    });
    return scriptPromise;
  }
</script>

<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { LOCATION_TYPE_LABELS } from '$lib/domain/assessment';
  import { LIMITS, PROPOSAL_TAGS, validateProposal, type ProposalTag } from '$lib/domain/proposal';
  import { loadBank } from '$lib/domain/question-bank';
  import { findSimilarGrouped } from '$lib/domain/similarity';
  import { externalLink, isDesktop, openExternal } from '$lib/platform';
  import { GITHUB_PROPOSAL_URL, proposalConfig, sendProposal, WEB_APP_URL, type SendResult } from '$lib/proposal-client';
  import SelectField from './SelectField.svelte';

  let { open = $bindable(false), initialText = '' }: { open?: boolean; initialText?: string } = $props();

  const DEBOUNCE_MS = 300;
  const DIFFERENT_SCORE = 0.6;
  const NO_LIST = 'none';
  const config = proposalConfig();
  const bank = loadBank();
  const LIST_OPTIONS = [
    { value: NO_LIST, label: 'Yok' },
    ...[...new Set(bank.flatMap((q) => (q.listCode ? [q.listCode] : [])))].sort().map((c) => ({ value: c, label: c })),
  ];

  let text = $state('');
  let listCode = $state(NO_LIST);
  let tags = $state.raw<readonly ProposalTag[]>([]);
  let basis = $state('');
  let reason = $state('');
  let different = $state(false);
  let errors = $state.raw<string[]>([]);
  let result = $state.raw<SendResult | null>(null);
  let sending = $state(false);
  let debounced = $state('');
  let token = $state('');
  let widgetError = $state('');
  let widgetEl = $state<HTMLElement | null>(null);
  let widgetId: string | undefined;

  $effect(() => {
    if (!open) return;
    text = initialText;
    debounced = initialText;
    listCode = NO_LIST;
    tags = [];
    basis = '';
    reason = '';
    different = false;
    errors = [];
    result = null;
    token = '';
    widgetError = '';
  });

  $effect(() => {
    const current = text;
    const timer = setTimeout(() => (debounced = current), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    const el = widgetEl;
    if (!el || !config.enabled) return;
    let api: TurnstileApi | undefined;
    let cancelled = false;
    loadTurnstile().then(
      (loaded) => {
        if (cancelled) return;
        api = loaded;
        widgetId = loaded.render(el, {
          sitekey: config.siteKey,
          callback: (t) => (token = t),
          'expired-callback': () => (token = ''),
          'error-callback': () => (token = ''),
        });
      },
      () => {
        if (!cancelled) widgetError = 'Doğrulama bileşeni yüklenemedi. İnternet bağlantınızı kontrol edip yeniden deneyin.';
      },
    );
    return () => {
      cancelled = true;
      if (api && widgetId) api.remove(widgetId);
      widgetId = undefined;
    };
  });

  const similar = $derived(debounced.trim().length >= LIMITS.textMin ? findSimilarGrouped(debounced, bank) : []);
  const needsDifferent = $derived(similar.some((h) => h.score >= DIFFERENT_SCORE));
  const canSend = $derived(!sending && token !== '' && (!needsDifferent || different));

  function toggleTag(tag: ProposalTag, on: boolean) {
    tags = on ? [...tags, tag] : tags.filter((t) => t !== tag);
  }

  async function submit() {
    const checked = validateProposal({ text, listCode: listCode === NO_LIST ? '' : listCode, tags, basis, reason });
    if (!checked.ok) {
      errors = checked.errors;
      return;
    }
    errors = [];
    sending = true;
    const sent = await sendProposal(checked.value, token);
    sending = false;
    result = sent;
    const api = turnstileApi();
    if (widgetId && api) api.reset(widgetId);
    token = '';
  }

  const textError = $derived(errors.find((e) => e.startsWith('Madde metni')));
  const listError = $derived(errors.find((e) => e.startsWith('İlgili MEB')));
  const basisError = $derived(errors.find((e) => e.startsWith('Dayanak')));
  const reasonError = $derived(errors.find((e) => e.startsWith('Gerekçe')));
  const otherErrors = $derived(errors.filter((e) => ![textError, listError, basisError, reasonError].includes(e)));
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90vh] flex-col sm:max-w-xl">
    <Dialog.Header>
      <Dialog.Title>Madde öner</Dialog.Title>
      <Dialog.Description>Kontrol listelerinde olmayan bir madde önerin.</Dialog.Description>
    </Dialog.Header>

    {#if isDesktop()}
      <div class="space-y-3 text-sm">
        <p>Öneriler tarayıcıda gönderilir.</p>
        <div class="flex flex-wrap gap-2">
          <Button onclick={() => void openExternal(`${WEB_APP_URL}?oner=${encodeURIComponent(text.trim().slice(0, LIMITS.textMax))}#kutuphane`)}>Tarayıcıda aç</Button>
          <Button variant="outline" href={GITHUB_PROPOSAL_URL} target="_blank" rel="noopener noreferrer" {@attach externalLink}>GitHub üzerinden öner (hesap gerekir)</Button>
        </div>
      </div>
    {:else if !config.enabled}
      <div class="space-y-3 text-sm">
        <p role="status">Bu kurulumda öneri gönderme açık değil.</p>
        <Button variant="outline" href={GITHUB_PROPOSAL_URL} target="_blank" rel="noopener noreferrer" {@attach externalLink}>GitHub üzerinden öner (hesap gerekir)</Button>
      </div>
    {:else if result?.ok}
      <p class="text-sm" role="status">
        {#if result.status === 'created'}
          Öneriniz iletildi.{#if result.url} Takip: <a class="underline" href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>{/if}
        {:else if result.status === 'duplicate'}
          Benzer bir öneri zaten var; sizinki ona eklendi:{#if result.url} <a class="underline" href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>{/if}
        {:else}
          Bu madde kontrol listelerinde zaten var: {'key' in result ? (result.key ?? '') : ''}
        {/if}
      </p>
      <Dialog.Footer><Button onclick={() => (open = false)}>Kapat</Button></Dialog.Footer>
    {:else}
      <form
        class="min-h-0 flex-1 space-y-4 overflow-y-auto px-0.5"
        onsubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div class="space-y-1.5">
          <Label for="propose-text">Madde metni</Label>
          <Textarea id="propose-text" bind:value={text} rows={3} aria-invalid={textError ? true : undefined} />
          <p class="text-xs text-muted-foreground tabular-nums">{text.trim().length} / {LIMITS.textMax}</p>
          {#if textError}<p class="text-xs text-destructive" role="alert">{textError}</p>{/if}
        </div>

        {#if similar.length}
          <div class="space-y-1.5 rounded-md border p-2" role="status">
            <p class="text-sm font-medium">Benzer maddeler</p>
            {#each similar as hit (hit.keys[0])}
              <p class="text-sm"><Badge variant="outline" class="mr-1 tabular-nums" title={hit.keys.join(", ")}>{hit.keys[0]}{hit.keys.length > 1 ? ` +${hit.keys.length - 1}` : ""}</Badge>{hit.text} <span class="text-xs text-muted-foreground tabular-nums">%{Math.round(hit.score * 100)}</span></p>
            {/each}
            {#if needsDifferent}
              <Label class="items-start gap-2 pt-1"><Checkbox class="mt-0.5" bind:checked={different} />Önerim bunlardan farklı</Label>
            {/if}
          </div>
        {/if}

        <div class="space-y-1.5">
          <Label>İlgili MEB listesi (isteğe bağlı)</Label>
          <SelectField options={LIST_OPTIONS} value={listCode} onValueChange={(v) => (listCode = v)} label="İlgili MEB listesi" />
          {#if listError}<p class="text-xs text-destructive" role="alert">{listError}</p>{/if}
        </div>

        <fieldset class="space-y-1.5">
          <legend class="text-sm font-medium">Mekân türleri</legend>
          <div class="grid grid-cols-2 gap-1.5">
            {#each PROPOSAL_TAGS as tag (tag)}
              <Label class="gap-2 font-normal"><Checkbox checked={tags.includes(tag)} onCheckedChange={(v) => toggleTag(tag, v === true)} />{LOCATION_TYPE_LABELS[tag]}</Label>
            {/each}
          </div>
        </fieldset>

        <div class="space-y-1.5">
          <Label for="propose-basis">Dayanak (isteğe bağlı)</Label>
          <Input id="propose-basis" bind:value={basis} placeholder="Mevzuat veya standart" aria-invalid={basisError ? true : undefined} />
          {#if basisError}<p class="text-xs text-destructive" role="alert">{basisError}</p>{/if}
        </div>

        <div class="space-y-1.5">
          <Label for="propose-reason">Gerekçe</Label>
          <Textarea id="propose-reason" bind:value={reason} rows={3} aria-invalid={reasonError ? true : undefined} />
          <p class="text-xs text-muted-foreground tabular-nums">{reason.trim().length} / {LIMITS.reasonMax}</p>
          {#if reasonError}<p class="text-xs text-destructive" role="alert">{reasonError}</p>{/if}
        </div>

        {#each otherErrors as e (e)}<p class="text-xs text-destructive" role="alert">{e}</p>{/each}

        <div bind:this={widgetEl}></div>
        {#if widgetError}<p class="text-sm text-destructive" role="alert">{widgetError}</p>{/if}
        {#if result && !result.ok}<p class="text-sm text-destructive" role="alert">{result.message}</p>{/if}

        <p class="text-xs text-muted-foreground">Yalnız bu formdaki bilgiler gönderilir; adınız ve okul bilgileriniz gönderilmez. Öneri herkese açık bir GitHub sayfasında yayımlanır.</p>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={() => (open = false)}>Vazgeç</Button>
          <Button type="submit" disabled={!canSend}>{sending ? 'Gönderiliyor…' : 'Öneriyi gönder'}</Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
