import { describe, expect, it } from "vitest";
import { csvCell, monthExportCsv, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves plain values alone", () => {
    expect(csvCell("rent")).toBe("rent");
    expect(csvCell(12.5)).toBe("12.5");
    expect(csvCell(null)).toBe("");
  });

  it("quotes commas, quotes, and new lines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });
});

describe("monthExportCsv", () => {
  it("writes expense and settlement sections", () => {
    const csv = monthExportCsv(
      [
        {
          date: "2026-09-01",
          item: "Rent",
          amount: 1000,
          currency: "INR",
          category: "Housing",
          paidBy: "Alex",
          splitType: "equal",
          note: "",
        },
      ],
      [
        {
          date: "2026-09-02",
          from: "Jordan",
          to: "Alex",
          amount: 500,
          currency: "INR",
          status: "confirmed",
          note: "UPI",
        },
      ],
    );

    expect(csv).toContain("Expenses");
    expect(csv).toContain("Settlements");
    expect(csv).toContain(toCsv(
      ["Date", "Item", "Amount", "Currency", "Category", "Paid by", "Split", "Note"],
      [["2026-09-01", "Rent", 1000, "INR", "Housing", "Alex", "equal", ""]],
    ).trim());
    expect(csv).toContain("Jordan");
  });
});
