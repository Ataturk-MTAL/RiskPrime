interface ImportMetaEnv {
  /** Base URL of the proposal relay; proposals are disabled when empty. */
  readonly VITE_PROPOSAL_URL?: string;
  /** Cloudflare Turnstile site key; proposals are disabled when empty. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}
