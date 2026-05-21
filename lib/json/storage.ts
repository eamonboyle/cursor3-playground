import { defaultJsonPersisted } from "./defaults"
import type { JsonIndent, JsonPersisted } from "./types"

const STORAGE_KEY = "cursor3-json-v1"

function isJsonIndent(value: unknown): value is JsonIndent {
  return value === 2 || value === 4 || value === "tab"
}

function isJsonPersisted(value: unknown): value is JsonPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as JsonPersisted
  return typeof v.input === "string" && isJsonIndent(v.indent)
}

export function loadJsonPersisted(): JsonPersisted {
  if (typeof window === "undefined") {
    return defaultJsonPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultJsonPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isJsonPersisted(parsed)) {
      return defaultJsonPersisted()
    }
    return parsed
  } catch {
    return defaultJsonPersisted()
  }
}

export function saveJsonPersisted(state: JsonPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
