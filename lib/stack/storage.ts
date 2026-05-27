import { defaultStackPersisted } from "./defaults"
import type { StackPersisted } from "./types"

const STORAGE_KEY = "cursor3-stack-v1"

function isStackPersisted(value: unknown): value is StackPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as StackPersisted
  return (
    typeof v.text === "string" &&
    typeof v.hideNodeModules === "boolean" &&
    typeof v.hideInternals === "boolean"
  )
}

export function loadStackPersisted(): StackPersisted {
  if (typeof window === "undefined") {
    return defaultStackPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultStackPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isStackPersisted(parsed)) {
      return defaultStackPersisted()
    }
    return parsed
  } catch {
    return defaultStackPersisted()
  }
}

export function saveStackPersisted(state: StackPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
