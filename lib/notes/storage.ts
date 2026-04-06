import type { Note } from "./types"

const STORAGE_KEY = "cursor3-notes-v1"

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as Note
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.body === "string" &&
    typeof v.updatedAt === "string"
  )
}

function defaultNotes(): Note[] {
  return [
    {
      id: "welcome",
      title: "Welcome",
      body: "# Hello\n\nThis is a **markdown-friendly** scratchpad.\n\n- Export any note as `.md`\n- Notes stay in localStorage",
      updatedAt: new Date().toISOString(),
    },
  ]
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") {
    return defaultNotes()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultNotes()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isNote)) {
      return defaultNotes()
    }
    return parsed
  } catch {
    return defaultNotes()
  }
}

export function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}
