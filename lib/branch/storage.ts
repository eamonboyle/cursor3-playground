import { defaultBranchPersisted } from "./defaults"
import type { BranchPersisted, BranchPrefix } from "./types"

const STORAGE_KEY = "cursor3-branch-v1"

function isBranchPrefix(value: unknown): value is BranchPrefix {
  return (
    value === "" ||
    value === "feat" ||
    value === "fix" ||
    value === "chore" ||
    value === "cursor"
  )
}

function isBranchPersisted(value: unknown): value is BranchPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as BranchPersisted
  return (
    isBranchPrefix(v.prefix) &&
    typeof v.maxLength === "number" &&
    typeof v.title === "string"
  )
}

export function loadBranchPersisted(): BranchPersisted {
  if (typeof window === "undefined") {
    return defaultBranchPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultBranchPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isBranchPersisted(parsed)) {
      return defaultBranchPersisted()
    }
    return parsed
  } catch {
    return defaultBranchPersisted()
  }
}

export function saveBranchPersisted(state: BranchPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
