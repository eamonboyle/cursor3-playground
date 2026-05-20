/** Standard five-field cron: minute hour day-of-month month day-of-week */
export const CRON_FIELD_LABELS = [
  "Minute",
  "Hour",
  "Day (month)",
  "Month",
  "Weekday",
] as const

export function splitCronFields(expression: string): string[] | null {
  const trimmed = expression.trim()
  if (!trimmed) {
    return null
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length !== 5 && parts.length !== 6) {
    return null
  }
  // Ignore optional seconds field for display when six-part
  return parts.length === 6 ? parts.slice(1) : parts
}
