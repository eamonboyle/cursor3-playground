import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns"

import type { Category, Transaction } from "./types"

export function transactionsInMonth(
  transactions: Transaction[],
  month: Date,
): Transaction[] {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return transactions.filter((t) => {
    const d = parseISO(t.date)
    return isWithinInterval(d, { start, end })
  })
}

export function spentByCategory(
  transactions: Transaction[],
  month: Date,
): Record<string, number> {
  const inMonth = transactionsInMonth(transactions, month)
  const map: Record<string, number> = {}
  for (const t of inMonth) {
    map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
  }
  return map
}

export function totalSpent(transactions: Transaction[], month: Date): number {
  return transactionsInMonth(transactions, month).reduce(
    (s, t) => s + t.amount,
    0,
  )
}

export function totalBudget(categories: Category[]): number {
  return categories.reduce((s, c) => s + c.monthlyBudget, 0)
}
