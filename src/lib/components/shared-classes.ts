import type { LevelKey } from "$lib/domain/matrix";

// Tailwind class strings used by several components; colours come from the theme variables in app.css.

/** Section heading inside a page. */
export const SECTION_TITLE = "text-sm leading-5 font-medium text-muted-foreground";

/** Custom clickable rows (steps, accordion triggers, location cards): same hover, press and focus as buttons. */
export const INTERACTIVE_ROW =
  "transition-colors duration-150 motion-reduce:transition-none hover:bg-accent active:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Risk level on screen: soft row fill, strong ledger stripe, badge. Full literals so Tailwind generates them. */
export const RISK_TONE: Record<LevelKey, { fill: string; stripe: string; badge: string }> = {
  negligible: {
    fill: "bg-risk-negligible-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-negligible)]",
    badge:
      "bg-risk-negligible-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-negligible)]",
  },
  low: {
    fill: "bg-risk-low-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-low)]",
    badge: "bg-risk-low-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-low)]",
  },
  medium: {
    fill: "bg-risk-medium-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-medium)]",
    badge: "bg-risk-medium-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-medium)]",
  },
  high: {
    fill: "bg-risk-high-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-high)]",
    badge: "bg-risk-high-soft text-foreground shadow-[inset_3px_0_0_var(--color-risk-high)]",
  },
  intolerable: {
    fill: "bg-risk-intolerable-soft",
    stripe: "shadow-[inset_4px_0_0_var(--color-risk-intolerable)]",
    badge: "bg-risk-intolerable text-risk-intolerable-foreground",
  },
};
