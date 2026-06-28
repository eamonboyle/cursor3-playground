/** Sample agent context with citations and path headers for the demo textarea. */
export const SAMPLE_CONTEXT_INPUT = `## Task
Refactor the habit streak logic and add tests for month boundaries.

--- lib/habits/streak.ts ---
import type { HabitDay } from "./types"

export function computeStreak(days: HabitDay[]): number {
  // walk backward from today counting consecutive marked days
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (!days[i]?.completed) break
    streak++
  }
  return streak
}

\`\`\`12:28:lib/habits/streak.ts
export function computeStreak(days: HabitDay[]): number {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (!days[i]?.completed) break
    streak++
  }
  return streak
}
\`\`\`

--- lib/habits/streak.test.ts ---
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { computeStreak } from "./streak.ts"

describe("computeStreak", () => {
  it("counts trailing completed days", () => {
    assert.equal(computeStreak([{ completed: true }, { completed: false }]), 1)
  })
})
`