const STORAGE_KEY = "cursor3-focus-v1"

export type FocusPersisted = {
  tasks: { id: string; text: string; done: boolean }[]
  workMinutes: number
  breakMinutes: number
}

const defaultState: FocusPersisted = {
  tasks: [],
  workMinutes: 25,
  breakMinutes: 5,
}

export function loadFocusPersisted(): FocusPersisted {
  if (typeof window === "undefined") {
    return defaultState
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState
    }
    const parsed = JSON.parse(raw) as Partial<FocusPersisted>
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      workMinutes:
        typeof parsed.workMinutes === "number" && parsed.workMinutes > 0
          ? Math.min(120, parsed.workMinutes)
          : defaultState.workMinutes,
      breakMinutes:
        typeof parsed.breakMinutes === "number" && parsed.breakMinutes > 0
          ? Math.min(60, parsed.breakMinutes)
          : defaultState.breakMinutes,
    }
  } catch {
    return defaultState
  }
}

export function saveFocusPersisted(state: FocusPersisted) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
