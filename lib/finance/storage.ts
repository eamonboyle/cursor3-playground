import { defaultFinanceState } from "./defaults"
import type { FinanceState } from "./types"

const STORAGE_KEY = "cursor3-finance-v1"

function isFinanceState(value: unknown): value is FinanceState {
  if (!value || typeof value !== "object") {
    return false
  }
  const v = value as FinanceState
  return Array.isArray(v.categories) && Array.isArray(v.transactions)
}

export function loadFinanceState(): FinanceState {
  if (typeof window === "undefined") {
    return defaultFinanceState()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultFinanceState()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isFinanceState(parsed)) {
      return defaultFinanceState()
    }
    return parsed
  } catch {
    return defaultFinanceState()
  }
}

export function saveFinanceState(state: FinanceState) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
