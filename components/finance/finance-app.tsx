"use client"

import { addMonths, format, parseISO, subMonths } from "date-fns"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { BudgetBarChart } from "@/components/finance/budget-bar-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { defaultFinanceState, nextColorVar } from "@/lib/finance/defaults"
import {
  spentByCategory,
  totalBudget,
  totalSpent,
  transactionsInMonth,
} from "@/lib/finance/compute"
import { loadFinanceState, saveFinanceState } from "@/lib/finance/storage"
import type { Category, FinanceState, Transaction } from "@/lib/finance/types"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Wallet01Icon } from "@hugeicons/core-free-icons"

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  })
}

export function FinanceApp() {
  const [state, setState] = React.useState<FinanceState>(() =>
    defaultFinanceState(),
  )
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    setState(loadFinanceState())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveFinanceState(state)
  }, [state])

  const [viewMonth, setViewMonth] = React.useState(() => new Date())
  const [txFilterCategory, setTxFilterCategory] = React.useState<string>("all")

  const [newAmount, setNewAmount] = React.useState("")
  const [newDate, setNewDate] = React.useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  )
  const [newCategoryId, setNewCategoryId] = React.useState("")
  const [newNote, setNewNote] = React.useState("")

  const [newCatName, setNewCatName] = React.useState("")
  const [newCatBudget, setNewCatBudget] = React.useState("")

  React.useEffect(() => {
    if (!ready || state.categories.length === 0) {
      return
    }
    if (!newCategoryId || !state.categories.some((c) => c.id === newCategoryId)) {
      setNewCategoryId(state.categories[0]!.id)
    }
  }, [ready, state.categories, newCategoryId])

  const spentMap = spentByCategory(state.transactions, viewMonth)
  const monthTx = transactionsInMonth(state.transactions, viewMonth)
  const filteredTx =
    txFilterCategory === "all"
      ? monthTx
      : monthTx.filter((t) => t.categoryId === txFilterCategory)
  const sortedTx = [...filteredTx].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
  )

  const sumSpent = totalSpent(state.transactions, viewMonth)
  const sumBudget = totalBudget(state.categories)
  const remaining = Math.max(0, sumBudget - sumSpent)

  const chartRows = state.categories.map((c) => ({
    name: c.name,
    spent: Math.round((spentMap[c.id] ?? 0) * 100) / 100,
    budget: c.monthlyBudget,
  }))

  function addTransaction(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number.parseFloat(newAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a positive amount.")
      return
    }
    if (!newCategoryId) {
      toast.error("Pick a category.")
      return
    }
    const tx: Transaction = {
      id: crypto.randomUUID(),
      categoryId: newCategoryId,
      amount,
      date: newDate,
      note: newNote.trim(),
    }
    setState((s) => ({ ...s, transactions: [tx, ...s.transactions] }))
    setNewAmount("")
    setNewNote("")
    toast.success("Transaction added.")
  }

  function removeTransaction(id: string) {
    setState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id),
    }))
    toast.success("Removed transaction.")
  }

  function updateCategoryBudget(id: string, monthlyBudget: number) {
    if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
      return
    }
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, monthlyBudget } : c,
      ),
    }))
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = newCatName.trim()
    const budget = Number.parseFloat(newCatBudget)
    if (!name) {
      toast.error("Category name is required.")
      return
    }
    if (!Number.isFinite(budget) || budget < 0) {
      toast.error("Enter a valid budget.")
      return
    }
    const cat: Category = {
      id: crypto.randomUUID(),
      name,
      monthlyBudget: budget,
      colorVar: nextColorVar(state.categories),
    }
    setState((s) => ({ ...s, categories: [...s.categories, cat] }))
    setNewCatName("")
    setNewCatBudget("")
    toast.success("Category added.")
  }

  function removeCategory(id: string) {
    const hasTx = state.transactions.some((t) => t.categoryId === id)
    if (hasTx) {
      toast.error("Remove transactions in this category first.")
      return
    }
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
    }))
    if (txFilterCategory === id) {
      setTxFilterCategory("all")
    }
    toast.success("Category removed.")
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading your sandbox…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/">Back to playground</Link>
          </Button>
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Wallet01Icon}
              strokeWidth={2}
              className="size-8 text-primary"
              aria-hidden
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Finance sandbox
              </h1>
              <p className="text-sm text-muted-foreground">
                Demo budgets and spending. Data stays in this browser (
                <span className="font-mono text-xs">localStorage</span>).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-card px-2 py-1.5 shadow-xs">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            ‹
          </Button>
          <span className="min-w-[9.5rem] text-center text-sm font-medium tabular-nums">
            {format(viewMonth, "MMMM yyyy")}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            ›
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview" className="gap-6">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Spent this month</CardDescription>
                <CardTitle className="font-mono text-2xl tabular-nums">
                  {money(sumSpent)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total budgets</CardDescription>
                <CardTitle className="font-mono text-2xl tabular-nums">
                  {money(sumBudget)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Headroom</CardDescription>
                <CardTitle className="font-mono text-2xl tabular-nums">
                  {money(remaining)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Budget vs spent</CardTitle>
              <CardDescription>
                Compare monthly caps to outflows for {format(viewMonth, "MMMM")}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetBarChart rows={chartRows} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By category</CardTitle>
              <CardDescription>
                Progress toward each category budget this month.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {state.categories.map((c) => {
                const spent = spentMap[c.id] ?? 0
                const pct =
                  c.monthlyBudget > 0
                    ? Math.min(100, (spent / c.monthlyBudget) * 100)
                    : 0
                const over = spent > c.monthlyBudget
                return (
                  <div key={c.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{
                            backgroundColor: `var(${c.colorVar})`,
                          }}
                          aria-hidden
                        />
                        <span className="truncate font-medium">{c.name}</span>
                        {over ? (
                          <Badge variant="destructive" className="shrink-0">
                            Over
                          </Badge>
                        ) : null}
                      </div>
                      <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                        {money(spent)} / {money(c.monthlyBudget)}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={cn(over && "[&_[data-slot=progress-indicator]]:bg-destructive")}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add transaction</CardTitle>
              <CardDescription>
                Log an expense for the selected calendar month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addTransaction}>
                <FieldGroup className="gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                  <Field>
                    <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
                    <FieldContent>
                      <Input
                        id="tx-amount"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        required
                        min={0}
                        step="0.01"
                        className="font-mono"
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tx-date">Date</FieldLabel>
                    <FieldContent>
                      <Input
                        id="tx-date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tx-category">Category</FieldLabel>
                    <FieldContent>
                      <Select
                        value={newCategoryId}
                        onValueChange={setNewCategoryId}
                      >
                        <SelectTrigger id="tx-category" className="w-full">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {state.categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <Field className="sm:col-span-2 lg:col-span-1">
                    <FieldLabel htmlFor="tx-note">Note</FieldLabel>
                    <FieldContent>
                      <Input
                        id="tx-note"
                        placeholder="Optional"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
                <Button type="submit" className="mt-4">
                  Add transaction
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium">This month</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground" id="tx-filter-label">
                Filter
              </span>
              <Select
                value={txFilterCategory}
                onValueChange={setTxFilterCategory}
              >
                <SelectTrigger
                  className="w-[200px]"
                  aria-labelledby="tx-filter-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {state.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedTx.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>No transactions</EmptyTitle>
                <EmptyDescription>
                  Nothing logged for this month with the current filter.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" variant="outline" asChild>
                  <a href="#tx-amount">Add one above</a>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="rounded-xl border bg-card shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTx.map((t) => {
                    const cat = state.categories.find(
                      (c) => c.id === t.categoryId,
                    )
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {format(parseISO(t.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{cat?.name ?? "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {t.note || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {money(t.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeTransaction(t.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>New category</CardTitle>
              <CardDescription>
                Assign a monthly cap. Colors cycle through the theme palette.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addCategory} className="flex flex-col gap-4">
                <FieldGroup className="gap-4 sm:flex-row sm:items-end">
                  <Field className="flex-1">
                    <FieldLabel htmlFor="cat-name">Name</FieldLabel>
                    <FieldContent>
                      <Input
                        id="cat-name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Subscriptions"
                      />
                    </FieldContent>
                  </Field>
                  <Field className="sm:max-w-[200px]">
                    <FieldLabel htmlFor="cat-budget">Monthly budget</FieldLabel>
                    <FieldContent>
                      <Input
                        id="cat-budget"
                        inputMode="decimal"
                        value={newCatBudget}
                        onChange={(e) => setNewCatBudget(e.target.value)}
                        placeholder="0"
                        className="font-mono"
                      />
                    </FieldContent>
                  </Field>
                  <Button type="submit">Add category</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Monthly budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.categories.map((c) => {
                  const hasTx = state.transactions.some(
                    (t) => t.categoryId === c.id,
                  )
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{
                              backgroundColor: `var(${c.colorVar})`,
                            }}
                            aria-hidden
                          />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          className="max-w-[140px] font-mono"
                          value={c.monthlyBudget}
                          onChange={(e) =>
                            updateCategoryBudget(c.id, Number(e.target.value))
                          }
                          aria-label={`Monthly budget for ${c.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={hasTx}
                          title={
                            hasTx
                              ? "Delete transactions using this category first"
                              : "Remove category"
                          }
                          className="text-destructive hover:text-destructive disabled:opacity-40"
                          onClick={() => removeCategory(c.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — personal finance sandbox demo.
      </footer>
    </div>
  )
}
