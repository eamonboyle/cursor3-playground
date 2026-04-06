export type Category = {
  id: string
  name: string
  monthlyBudget: number
  /** Theme token, e.g. `--chart-1` */
  colorVar: string
}

export type Transaction = {
  id: string
  categoryId: string
  amount: number
  date: string
  note: string
}

export type FinanceState = {
  categories: Category[]
  transactions: Transaction[]
}
