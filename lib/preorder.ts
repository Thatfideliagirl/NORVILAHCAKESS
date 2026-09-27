// A pre-order product's current ordering window, worked out fresh
// from its template every time -- rather than a stored "current
// cycle" that a scheduled job would need to reset. Given the same
// starts_at/ends_at/recurring and the same day, this always returns
// the same answer, so nothing can drift or silently stop rolling
// over.
export type PreorderCycle = {
  cycleStart: string; // "YYYY-MM-DD"
  cycleEnd: string;
  hasStarted: boolean;
  hasEnded: boolean; // only ever true for a non-recurring window
};

const DAY_MS = 86400000;

function parseDate(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getTime();
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function currentPreorderCycle(
  startsAt: string,
  endsAt: string,
  recurring: boolean,
  now: Date = new Date()
): PreorderCycle {
  const start = parseDate(startsAt);
  const end = parseDate(endsAt);
  const cycleLengthDays = Math.max(1, Math.round((end - start) / DAY_MS) + 1);
  const today = parseDate(formatDate(now.getTime()));

  if (today < start) {
    return { cycleStart: startsAt, cycleEnd: endsAt, hasStarted: false, hasEnded: false };
  }

  if (!recurring) {
    return { cycleStart: startsAt, cycleEnd: endsAt, hasStarted: true, hasEnded: today > end };
  }

  const daysSinceStart = Math.floor((today - start) / DAY_MS);
  const cyclesElapsed = Math.floor(daysSinceStart / cycleLengthDays);
  const cycleStartMs = start + cyclesElapsed * cycleLengthDays * DAY_MS;
  const cycleEndMs = cycleStartMs + (cycleLengthDays - 1) * DAY_MS;

  return {
    cycleStart: formatDate(cycleStartMs),
    cycleEnd: formatDate(cycleEndMs),
    hasStarted: true,
    hasEnded: false,
  };
}

export function preorderCycleLengthDays(startsAt: string, endsAt: string): number {
  return Math.max(1, Math.round((parseDate(endsAt) - parseDate(startsAt)) / DAY_MS) + 1);
}

// The day after a window closes -- e.g. orders close Wednesday, ready
// Thursday -- shown to customers, not stored anywhere.
export function dayAfter(dateStr: string): string {
  return formatDate(parseDate(dateStr) + DAY_MS);
}

export function preorderIsOrderable(preorder: {
  hasStarted: boolean;
  hasEnded: boolean;
  slotsTaken: number;
  slotsTotal: number;
}): boolean {
  return preorder.hasStarted && !preorder.hasEnded && preorder.slotsTaken < preorder.slotsTotal;
}

export function formatPreorderDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
