import type { ContextPersisted } from "./types"

/** Sample multi-file agent context with Cursor citation fences and delimiters. */
export const SAMPLE_CONTEXT_INPUT = `Preamble notes for the agent — keep changes focused.

\`\`\`1:8:lib/finance/compute.ts
export function sumTransactions(
  items: Transaction[],
): number {
  return items.reduce((acc, item) => acc + item.amount, 0)
}

export function balanceForMonth(
\`\`\`

--- components/finance/finance-app.tsx ---
"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function FinanceApp() {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])
  if (!ready) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => toast.success("Saved")}>Save</Button>
      </CardContent>
    </Card>
  )
}

\`\`\`12:18:lib/playground/demos.ts
  {
    href: "/finance",
    title: "Finance sandbox",
    description:
      "Categories, monthly budgets, transactions, charts, and tabs with localStorage.",
    kind: "client",
  },
\`\`\`
`

export function defaultContextPersisted(): ContextPersisted {
  return {
    input: SAMPLE_CONTEXT_INPUT,
    tokenMethod: "chars",
    budgetLimit: 32_000,
  }
}
