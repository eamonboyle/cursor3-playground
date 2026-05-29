import { defaultImportPathPersisted } from "./defaults"
import type { ImportPathPersisted } from "./types"

const STORAGE_KEY = "cursor3-import-path-v1"

function isImportPathPersisted(value: unknown): value is ImportPathPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as ImportPathPersisted
  return (
    typeof v.fromFile === "string" &&
    typeof v.toFile === "string" &&
    typeof v.stripExtension === "boolean" &&
    typeof v.useAlias === "boolean"
  )
}

export function loadImportPathPersisted(): ImportPathPersisted {
  if (typeof window === "undefined") {
    return defaultImportPathPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultImportPathPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isImportPathPersisted(parsed)) {
      return defaultImportPathPersisted()
    }
    return parsed
  } catch {
    return defaultImportPathPersisted()
  }
}

export function saveImportPathPersisted(state: ImportPathPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
