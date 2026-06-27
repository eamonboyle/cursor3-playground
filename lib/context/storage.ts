import { defaultContextPersisted } from "./defaults"
import type { ContextPersisted, TokenEstimateMethod } from "./types"

const STORAGE_KEY = "cursor3-context-v1"

function isTokenMethod(value: unknown): value is TokenEstimateMethod {
  return value === "chars" || value === "words"
}

function isContextPersisted(value: unknown): value is ContextPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as ContextPersisted
  return (
    typeof v.input === "string" &&
    isTokenMethod(v.tokenMethod) &&
    typeof v.budgetLimit === "number"
  )
}

export function loadContextPersisted(): ContextPersisted {
  if (typeof window === "undefined") {
    return defaultContextPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultContextPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isContextPersisted(parsed)) {
      return defaultContextPersisted()
    }
    return parsed
  } catch {
    return defaultContextPersisted()
  }
}

export function saveContextPersisted(state: ContextPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
