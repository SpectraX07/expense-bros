export function csvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function csvRow(values: Array<string | number | null | undefined>) {
  return values.map(csvCell).join(",");
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [csvRow(headers), ...rows.map(csvRow)].join("\r\n") + "\r\n";
}

export type ExpenseCsvRow = {
  date: string;
  item: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string;
  splitType: string;
  note: string;
};

export type SettlementCsvRow = {
  date: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status: string;
  note: string;
};

export function monthExportCsv(
  expenses: ExpenseCsvRow[],
  settlements: SettlementCsvRow[],
) {
  const expenseSheet = toCsv(
    ["Date", "Item", "Amount", "Currency", "Category", "Paid by", "Split", "Note"],
    expenses.map((row) => [
      row.date,
      row.item,
      row.amount,
      row.currency,
      row.category,
      row.paidBy,
      row.splitType,
      row.note,
    ]),
  );

  const settlementSheet = toCsv(
    ["Date", "From", "To", "Amount", "Currency", "Status", "Note"],
    settlements.map((row) => [
      row.date,
      row.from,
      row.to,
      row.amount,
      row.currency,
      row.status,
      row.note,
    ]),
  );

  return `Expenses\r\n${expenseSheet}\r\nSettlements\r\n${settlementSheet}`;
}
