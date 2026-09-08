import { NextResponse } from "next/server";
import { getAppContext, parsePeriod } from "@/lib/app-context";
import { buildMonthExportCsv } from "@/lib/export-month";

export async function GET(request: Request) {
  const { household } = await getAppContext();
  const url = new URL(request.url);
  const { year, month } = parsePeriod(
    url.searchParams.get("year") ?? undefined,
    url.searchParams.get("month") ?? undefined,
  );

  const csv = await buildMonthExportCsv(
    household.householdId,
    household.currency,
    year,
    month,
  );
  const filename = `expensebros-${year}-${String(month).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
