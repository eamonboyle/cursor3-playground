import type { HabitsState } from "./types"

const COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4"] as const

export function nextColorVar(existing: { colorVar: string }[]): string {
  return COLORS[existing.length % COLORS.length]!
}

export function defaultHabitsState(): HabitsState {
  const water = "habit-water"
  const walk = "habit-walk"
  return {
    habits: [
      { id: water, name: "Drink water", colorVar: "--chart-1" },
      { id: walk, name: "Walk 20m", colorVar: "--chart-2" },
    ],
    completions: {
      [water]: [],
      [walk]: [],
    },
  }
}
