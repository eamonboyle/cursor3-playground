import { isValid, parseISO } from "date-fns"

/**
 * Parse user input into a Date: ISO-8601 strings, Unix seconds, or Unix milliseconds.
 * Digits-only values with 13+ digits are treated as milliseconds; shorter runs as seconds.
 */
export function parseEpochInput(raw: string): Date | null {
  const s = raw.trim()
  if (!s) {
    return null
  }

  const fromDigits = parseDigitsOnlyTimestamp(s)
  if (fromDigits) {
    return fromDigits
  }

  const fromIso = parseISO(s)
  if (isValid(fromIso)) {
    return fromIso
  }

  const fromNative = new Date(s)
  return isValid(fromNative) ? fromNative : null
}

function parseDigitsOnlyTimestamp(s: string): Date | null {
  if (!/^-?\d+$/.test(s)) {
    return null
  }
  const n = Number(s)
  if (!Number.isFinite(n)) {
    return null
  }
  const digitLen = s.replace(/^-/, "").length
  const ms = digitLen >= 13 ? n : n * 1000
  const d = new Date(ms)
  return isValid(d) ? d : null
}
