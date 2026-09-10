import { describe, expect, it } from "vitest";
import { describeRange, parseHistoryRange } from "@/lib/history-range";

const NOW = new Date(2026, 8, 10); // 10 Sep 2026
const ANCHOR = { year: 2026, month: 9 };

describe("parseHistoryRange", () => {
  it("defaults to the anchored month", () => {
    expect(parseHistoryRange({}, ANCHOR, NOW)).toEqual({
      key: "month",
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it("falls back to the month for an unknown range", () => {
    expect(parseHistoryRange({ range: "nonsense" }, ANCHOR, NOW).key).toBe("month");
  });

  it("uses the anchor, not today, for the month range", () => {
    expect(parseHistoryRange({}, { year: 2026, month: 2 }, NOW)).toEqual({
      key: "month",
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("covers whole months for last3 and last6", () => {
    expect(parseHistoryRange({ range: "last3" }, ANCHOR, NOW)).toEqual({
      key: "last3",
      from: "2026-07-01",
      to: "2026-09-30",
    });
    expect(parseHistoryRange({ range: "last6" }, ANCHOR, NOW)).toEqual({
      key: "last6",
      from: "2026-04-01",
      to: "2026-09-30",
    });
  });

  it("spans the calendar year", () => {
    expect(parseHistoryRange({ range: "year" }, ANCHOR, NOW)).toEqual({
      key: "year",
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("leaves all time unbounded", () => {
    expect(parseHistoryRange({ range: "all" }, ANCHOR, NOW)).toEqual({
      key: "all",
      from: null,
      to: null,
    });
  });

  it("keeps one-sided custom ranges", () => {
    expect(parseHistoryRange({ range: "custom", from: "2026-03-05" }, ANCHOR, NOW)).toEqual({
      key: "custom",
      from: "2026-03-05",
      to: null,
    });
  });

  it("swaps a reversed custom range", () => {
    expect(
      parseHistoryRange({ range: "custom", from: "2026-05-01", to: "2026-03-01" }, ANCHOR, NOW),
    ).toEqual({ key: "custom", from: "2026-03-01", to: "2026-05-01" });
  });

  it("ignores unparseable custom dates", () => {
    expect(parseHistoryRange({ range: "custom", from: "not-a-date" }, ANCHOR, NOW)).toEqual({
      key: "custom",
      from: null,
      to: null,
    });
  });
});

describe("describeRange", () => {
  it("names the anchored month", () => {
    expect(describeRange(parseHistoryRange({}, ANCHOR, NOW), ANCHOR)).toBe("September 2026");
  });

  it("describes a custom span", () => {
    const range = parseHistoryRange(
      { range: "custom", from: "2026-03-01", to: "2026-04-02" },
      ANCHOR,
      NOW,
    );
    expect(describeRange(range, ANCHOR)).toBe("1 Mar 2026 – 2 Apr 2026");
  });

  it("describes an open-ended custom span", () => {
    const range = parseHistoryRange({ range: "custom", to: "2026-04-02" }, ANCHOR, NOW);
    expect(describeRange(range, ANCHOR)).toBe("Up to 2 Apr 2026");
  });

  it("describes all time", () => {
    expect(describeRange(parseHistoryRange({ range: "all" }, ANCHOR, NOW), ANCHOR)).toBe(
      "All time",
    );
  });
});
