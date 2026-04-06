import type { SavedLink } from "./types"

const STORAGE_KEY = "cursor3-links-v1"

function isSavedLink(value: unknown): value is SavedLink {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as SavedLink
  return (
    typeof v.id === "string" &&
    typeof v.url === "string" &&
    typeof v.title === "string" &&
    typeof v.savedAt === "string"
  )
}

export function loadSavedLinks(): SavedLink[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isSavedLink)
  } catch {
    return []
  }
}

export function saveSavedLinks(links: SavedLink[]) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}
