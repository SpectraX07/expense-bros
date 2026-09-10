import {
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export const RANGE_KEYS = ["month", "last3", "last6", "year", "all", "custom"] as const;

export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  month: "This month",
  last3: "Last 3 months",
  last6: "Last 6 months",
  year: "This year",
  all: "All time",
  custom: "Custom",
};

/** Chips shown in the UI, in order. "custom" is entered through the date inputs. */
export const RANGE_CHIPS: RangeKey[] = ["month", "last3", "last6", "year", "all"];

const ISO_DATE = "yyyy-MM-dd";

export type HistoryRange = {
  key: RangeKey;
  /** Inclusive bounds. `null` means unbounded on that side. */
  from: string | null;
  to: string | null;
};

function isRangeKey(value: string | undefined): value is RangeKey {
  return value !== undefined && (RANGE_KEYS as readonly string[]).includes(value);
}

export function parseIsoDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, ISO_DATE) : null;
}

export function parseHistoryRange(
  params: { range?: string; from?: string; to?: string },
  anchor: { year: number; month: number },
  now = new Date(),
): HistoryRange {
  const key: RangeKey = isRangeKey(params.range) ? params.range : "month";

  if (key === "custom") {
    const from = parseIsoDate(params.from);
    const to = parseIsoDate(params.to);
    // Tolerate a reversed range rather than returning nothing.
    if (from && to && from > to) {
      return { key, from: to, to: from };
    }
    return { key, from, to };
  }

  if (key === "all") {
    return { key, from: null, to: null };
  }

  if (key === "year") {
    return { key, from: format(startOfYear(now), ISO_DATE), to: format(endOfYear(now), ISO_DATE) };
  }

  if (key === "last3" || key === "last6") {
    const back = key === "last3" ? 2 : 5;
    return {
      key,
      from: format(startOfMonth(subMonths(now, back)), ISO_DATE),
      to: format(endOfMonth(now), ISO_DATE),
    };
  }

  const anchorDate = new Date(anchor.year, anchor.month - 1, 1);
  return {
    key: "month",
    from: format(startOfMonth(anchorDate), ISO_DATE),
    to: format(endOfMonth(anchorDate), ISO_DATE),
  };
}

export function describeRange(range: HistoryRange, anchor: { year: number; month: number }) {
  if (range.key === "month") {
    return format(new Date(anchor.year, anchor.month - 1, 1), "MMMM yyyy");
  }
  if (range.key === "all") {
    return "All time";
  }
  if (range.key === "custom") {
    const from = range.from ? format(parseISO(range.from), "d MMM yyyy") : null;
    const to = range.to ? format(parseISO(range.to), "d MMM yyyy") : null;
    if (from && to) {
      return `${from} – ${to}`;
    }
    if (from) {
      return `From ${from}`;
    }
    if (to) {
      return `Up to ${to}`;
    }
    return "All time";
  }
  if (range.from && range.to) {
    return `${format(parseISO(range.from), "MMM yyyy")} – ${format(parseISO(range.to), "MMM yyyy")}`;
  }
  return RANGE_LABELS[range.key];
}
