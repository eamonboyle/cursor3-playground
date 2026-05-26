import { defaultEnvPersisted } from "./defaults"
import type { EnvPersisted } from "./types"

const STORAGE_KEY = "cursor3-env-v1"

function isEnvPersisted(value: unknown): value is EnvPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as EnvPersisted
  return (
    typeof v.referenceText === "string" &&
    typeof v.localText === "string" &&
    typeof v.revealValues === "boolean"
  )
}

export function loadEnvPersisted(): EnvPersisted {
  if (typeof window === "undefined") {
    return defaultEnvPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultEnvPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isEnvPersisted(parsed)) {
      return defaultEnvPersisted()
    }
    return parsed
  } catch {
    return defaultEnvPersisted()
  }
}

export function saveEnvPersisted(state: EnvPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
