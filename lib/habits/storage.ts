import { defaultHabitsState } from "./defaults"
import type { HabitsState } from "./types"

const STORAGE_KEY = "cursor3-habits-v1"

function isHabitsState(value: unknown): value is HabitsState {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as HabitsState
  return Array.isArray(v.habits) && typeof v.completions === "object"
}

export function loadHabitsState(): HabitsState {
  if (typeof window === "undefined") {
    return defaultHabitsState()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultHabitsState()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isHabitsState(parsed)) {
      return defaultHabitsState()
    }
    return parsed
  } catch {
    return defaultHabitsState()
  }
}

export function saveHabitsState(state: HabitsState) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
