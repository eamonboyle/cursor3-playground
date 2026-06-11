import { defaultDepsPersisted } from "./defaults"
import type { DepsPersisted } from "./types"
import { DEP_SECTIONS } from "./types"

const STORAGE_KEY = "cursor3-deps-v1"

function isDepsPersisted(value: unknown): value is DepsPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as DepsPersisted
  return (
    typeof v.baseText === "string" &&
    typeof v.headText === "string" &&
    Array.isArray(v.sections) &&
    v.sections.every((s) => (DEP_SECTIONS as string[]).includes(s))
  )
}

export function loadDepsPersisted(): DepsPersisted {
  if (typeof window === "undefined") {
    return defaultDepsPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultDepsPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isDepsPersisted(parsed)) {
      return defaultDepsPersisted()
    }
    return parsed
  } catch {
    return defaultDepsPersisted()
  }
}

export function saveDepsPersisted(state: DepsPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
