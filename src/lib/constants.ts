export const APP_NAME = "ExpenseBros";

export const HOUSEHOLD_COOKIE = "eb-household-id";
export const INVITE_COOKIE = "eb-invite-code";

export const CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
