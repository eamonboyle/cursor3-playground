export type Habit = {
  id: string
  name: string
  colorVar: string
}

export type HabitsState = {
  habits: Habit[]
  /** habitId -> ISO date keys yyyy-MM-dd */
  completions: Record<string, string[]>
}
