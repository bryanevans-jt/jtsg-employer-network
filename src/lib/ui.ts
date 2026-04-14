/** Shared Tailwind class strings for a consistent nonprofit staff + public UI. */

const inputBase =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-jtsg-ink shadow-sm placeholder:text-stone-400 focus:border-jtsg-green focus:outline-none focus:ring-2 focus:ring-jtsg-green/25";

/** Full-width field under a label (includes top margin). */
export const inputClass = `mt-1 ${inputBase}`;

/** Same as `inputClass` without `mt-1` (e.g. dense grids). */
export const inputClassCompact = inputBase;

export const labelClass = "block text-sm font-medium text-stone-700";

const btnFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-jtsg-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export const btnPrimaryClass =
  `inline-flex w-full items-center justify-center rounded-lg bg-jtsg-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-jtsg-green-dark ${btnFocus}`;

/** Primary actions in toolbars / modals (not full width). */
export const btnPrimarySmClass =
  `inline-flex items-center justify-center rounded-lg bg-jtsg-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-jtsg-green-dark ${btnFocus}`;

export const btnSecondaryClass =
  "inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jtsg-green/30";

export const btnSecondarySmClass =
  `inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 ${btnFocus}`;

export const btnMutedSmClass =
  "inline-flex items-center justify-center rounded-lg bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2 disabled:opacity-50";

export const btnDangerSmClass =
  "inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2 disabled:opacity-50";

export const alertErrorClass = "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900";
export const alertSuccessClass =
  "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900";

export const cardElevatedClass =
  "rounded-2xl border border-stone-200/90 bg-white/95 p-8 shadow-lg backdrop-blur sm:p-10";
