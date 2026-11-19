// Tailwind class strings used by several components; colours come from the theme variables in app.css.

/** Section heading inside a page. */
export const SECTION_TITLE = "text-sm leading-5 font-medium text-muted-foreground";

/** Custom clickable rows (steps, accordion triggers, location cards): same hover, press and focus as buttons. */
export const INTERACTIVE_ROW =
  "transition-colors duration-150 motion-reduce:transition-none hover:bg-accent active:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
