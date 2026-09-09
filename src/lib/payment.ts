import { formatMoney } from "@/lib/money";

const UPI_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export function normalizePaymentHandle(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function isUpiHandle(handle: string | null | undefined) {
  return Boolean(handle && UPI_PATTERN.test(handle));
}

export function upiPayUrl(options: {
  handle: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  const params = new URLSearchParams({
    pa: options.handle,
    pn: options.payeeName,
    am: options.amount.toFixed(2),
    cu: "INR",
    tn: options.note.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}

export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function repaymentShareText(options: {
  amount: number;
  currency: string;
  householdName: string;
  payeeName: string;
  handle: string | null;
}) {
  const money = formatMoney(options.amount, options.currency);
  const handle = options.handle
    ? options.currency === "INR"
      ? ` UPI: ${options.handle}`
      : ` Pay: ${options.handle}`
    : "";
  return `Pay ${options.payeeName} ${money} for ${options.householdName} this month.${handle}`;
}
