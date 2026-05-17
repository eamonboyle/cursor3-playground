import { defaultIdsPersisted } from "./defaults"
import type { IdFormat, IdsPersisted } from "./types"

const STORAGE_KEY = "cursor3-ids-v1"

function isIdFormat(value: unknown): value is IdFormat {
  return value === "uuid" || value === "hex" || value === "base64url"
}

function isIdsPersisted(value: unknown): value is IdsPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as IdsPersisted
  return (
    isIdFormat(v.format) &&
    typeof v.count === "number" &&
    typeof v.entropyBytes === "number" &&
    typeof v.hexUppercase === "boolean"
  )
}

export function loadIdsPersisted(): IdsPersisted {
  if (typeof window === "undefined") {
    return defaultIdsPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultIdsPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isIdsPersisted(parsed)) {
      return defaultIdsPersisted()
    }
    return parsed
  } catch {
    return defaultIdsPersisted()
  }
}

export function saveIdsPersisted(state: IdsPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
