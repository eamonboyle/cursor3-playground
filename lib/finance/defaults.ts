import { addDays, format, startOfMonth } from "date-fns"

import type { FinanceState } from "./types"

const COLOR_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const

export function nextColorVar(
  existing: { colorVar: string }[],
): (typeof COLOR_VARS)[number] {
  const nextIndex = existing.length % COLOR_VARS.length
  return COLOR_VARS[nextIndex]!
}

export function defaultFinanceState(now = new Date()): FinanceState {
  const monthStart = startOfMonth(now)
  const d = (dayOffset: number) =>
    format(addDays(monthStart, dayOffset), "yyyy-MM-dd")

  const food = "cat-food"
  const transport = "cat-transport"
  const fun = "cat-fun"
  const home = "cat-home"

  return {
    categories: [
      { id: food, name: "Food", monthlyBudget: 600, colorVar: "--chart-1" },
      {
        id: transport,
        name: "Transport",
        monthlyBudget: 200,
        colorVar: "--chart-2",
      },
      { id: fun, name: "Fun", monthlyBudget: 150, colorVar: "--chart-3" },
      { id: home, name: "Home", monthlyBudget: 400, colorVar: "--chart-4" },
    ],
    transactions: [
      {
        id: "tx-seed-1",
        categoryId: food,
        amount: 86.42,
        date: d(2),
        note: "Groceries",
      },
      {
        id: "tx-seed-2",
        categoryId: food,
        amount: 24,
        date: d(6),
        note: "Coffee",
      },
      {
        id: "tx-seed-3",
        categoryId: transport,
        amount: 45,
        date: d(4),
        note: "Transit pass",
      },
      {
        id: "tx-seed-4",
        categoryId: fun,
        amount: 32.5,
        date: d(10),
        note: "Movies",
      },
      {
        id: "tx-seed-5",
        categoryId: home,
        amount: 120,
        date: d(1),
        note: "Utilities",
      },
    ],
  }
}
