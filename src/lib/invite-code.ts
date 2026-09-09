export function formatInviteCode(code: string) {
  const compact = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (compact.length === 8) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return compact;
}
