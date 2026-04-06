import { defaultContacts } from "./defaults"
import type { Contact } from "./types"

const STORAGE_KEY = "cursor3-crm-v1"

function isContact(value: unknown): value is Contact {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as Contact
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.company === "string" &&
    Array.isArray(v.tags) &&
    typeof v.notes === "string"
  )
}

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") {
    return defaultContacts()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultContacts()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isContact)) {
      return defaultContacts()
    }
    return parsed
  } catch {
    return defaultContacts()
  }
}

export function saveContacts(contacts: Contact[]) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
}
