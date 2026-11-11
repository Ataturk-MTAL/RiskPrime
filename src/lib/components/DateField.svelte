<script lang="ts">
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
  import { Calendar } from '$lib/components/ui/calendar';
  import { Input } from '$lib/components/ui/input';
  import * as Popover from '$lib/components/ui/popover';
  import { buttonVariants } from '$lib/components/ui/button';
  import { normalizeTrDate, parseTrDate } from '$lib/domain/date';
  import { cn } from '$lib/utils';

  let {
    id,
    value,
    onchange,
    error = '',
    class: className,
  }: {
    id: string;
    /** Stored text, normally "DD.MM.YYYY"; may be legacy free text. */
    value: string;
    onchange: (next: string) => void;
    /** Extra validation message from the caller (e.g. date order). */
    error?: string;
    class?: string;
  } = $props();

  let open = $state(false);
  const parsed = $derived(parseTrDate(value));
  const message = $derived(value.trim() && !parsed ? 'Tarih gg.aa.yyyy biçiminde olmalı' : error);
  const selected = $derived(parsed ? new CalendarDate(parsed.y, parsed.m, parsed.d) : undefined);
  const pad = (n: number) => String(n).padStart(2, '0');

  function pick(day: CalendarDate | undefined) {
    if (!day) return;
    onchange(`${pad(day.day)}.${pad(day.month)}.${day.year}`);
    open = false;
  }
</script>

<div class={cn('flex w-full flex-col gap-1', className)}>
  <div class="flex w-full">
    <Input
      {id}
      class="rounded-r-none text-foreground"
      inputmode="numeric"
      autocomplete="off"
      placeholder="gg.aa.yyyy"
      {value}
      aria-invalid={message ? true : undefined}
      aria-describedby={message ? `${id}-error` : undefined}
      onchange={(e) => onchange(normalizeTrDate(e.currentTarget.value))}
    />
    <Popover.Root bind:open>
      <Popover.Trigger
        class={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'shrink-0 rounded-l-none border-l-0')}
        aria-label="Takvimden seç"
      >
        <CalendarDays />
      </Popover.Trigger>
      <Popover.Content class="w-auto p-0" align="end">
        <Calendar
          type="single"
          value={selected}
          placeholder={selected ?? today(getLocalTimeZone())}
          onValueChange={(d) => pick(d as CalendarDate | undefined)}
          locale="tr-TR"
          weekStartsOn={1}
          captionLayout="dropdown"
        />
      </Popover.Content>
    </Popover.Root>
  </div>
  {#if message}<span id="{id}-error" class="text-xs text-destructive">{message}</span>{/if}
</div>
