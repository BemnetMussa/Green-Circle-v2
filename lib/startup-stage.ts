/** Company / funding stage — stored on startup documents; shown on cards & directory. */
export const STARTUP_STAGES = [
  'idea',
  'pre-seed',
  'seed',
  'series-a',
  'series-b-plus',
  'bootstrapped',
  'undisclosed',
] as const;

export type StartupStage = (typeof STARTUP_STAGES)[number];

export const STARTUP_STAGE_LABELS: Record<StartupStage, string> = {
  idea: 'Idea / pre-product',
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b-plus': 'Series B+',
  bootstrapped: 'Bootstrapped',
  undisclosed: 'Undisclosed',
};

export function formatStartupStage(
  raw: string | undefined | null
): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const key = raw.trim() as StartupStage;
  if (key in STARTUP_STAGE_LABELS) return STARTUP_STAGE_LABELS[key];
  return raw.trim();
}

/** Label for cards / directory; omits empty and `undisclosed` so UI stays clean. */
export function displayStartupStage(
  raw: string | undefined | null
): string | null {
  if (!raw?.trim() || raw.trim() === 'undisclosed') return null;
  return formatStartupStage(raw);
}
