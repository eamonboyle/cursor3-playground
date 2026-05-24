import { defaultCommitPersisted } from "./defaults"
import type { CommitPersisted } from "./types"

const STORAGE_KEY = "cursor3-commit-v1"

function isCommitPersisted(value: unknown): value is CommitPersisted {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as CommitPersisted
  return typeof v.draft === "string"
}

export function loadCommitPersisted(): CommitPersisted {
  if (typeof window === "undefined") {
    return defaultCommitPersisted()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultCommitPersisted()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isCommitPersisted(parsed)) {
      return defaultCommitPersisted()
    }
    return parsed
  } catch {
    return defaultCommitPersisted()
  }
}

export function saveCommitPersisted(state: CommitPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
