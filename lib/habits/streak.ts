import { format, subDays } from "date-fns"

/** Consecutive days ending today or yesterday (GitHub-style habit streak). */
export function computeStreak(dates: string[]): number {
  const set = new Set(dates)
  const today = new Date()
  const todayKey = format(today, "yyyy-MM-dd")
  const yesterdayKey = format(subDays(today, 1), "yyyy-MM-dd")

  let cursor: Date
  if (set.has(todayKey)) {
    cursor = today
  } else if (set.has(yesterdayKey)) {
    cursor = subDays(today, 1)
  } else {
    return 0
  }

  let n = 0
  let d = cursor
  while (set.has(format(d, "yyyy-MM-dd"))) {
    n++
    d = subDays(d, 1)
  }
  return n
}
