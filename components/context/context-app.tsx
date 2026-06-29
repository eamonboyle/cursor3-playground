"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_CONTEXT_TEXT } from "@/lib/context/defaults"
import {
  formatContextMarkdown,
  formatContextSectionTitles,
  parseContextInput,
  sectionsWithinBudget,
} from "@/lib/context/parse"
import { loadContextPersisted, saveContextPersisted } from "@/lib/context/storage"
import type { ContextBudgetId, ContextSection } from "@/lib/context/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-[0.8rem] font-medium tabular-nums">
        {value}
      </span>
    </div>
  )
}

function kindLabel(kind: ContextSection["kind"]): string {
  switch (kind) {
    case "citation":
      return "citation"
    case "path-header":
      return "path"
    case "plain":
      return "plain"
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function ContextApp() {
  const [input, setInput] = React.useState(SAMPLE_CONTEXT_TEXT)
  const [ready, setReady] = React.useState(false)
  const [focusBudget, setFocusBudget] = React.useState<ContextBudgetId>("32k")
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    setInput(loadContextPersisted().input)
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveContextPersisted({ input })
  }, [input])

  const result = React.useMemo(() => parseContextInput(input), [input])

  const focusStatus = React.useMemo(
    () => result.budgets.find((status) => status.budget.id === focusBudget),
    [result.budgets, focusBudget],
  )

  const trimPlan = React.useMemo(() => {
    if (!focusStatus) {
      return null
    }
    return sectionsWithinBudget(result.ranked, focusStatus.budget.limit)
  }, [focusStatus, result.ranked])

  async function copyText(label: string, text: string) {
    if (!text.trim()) {
      toast.error("Nothing to copy yet.")
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  if (!ready) {
    return null
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={AiBrain01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Context size lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Estimate tokens for pasted agent context — split by citation fences
              or <code className="text-xs">--- path ---</code> headers, rank
              sections, and compare 8k / 32k / 128k budgets.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            ~{result.totalTokens.toLocaleString()} tokens
          </Badge>
          <Badge variant="outline">{result.sections.length} section(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent context</CardTitle>
          <CardDescription>
            Paste chat logs, @-file dumps, tool output, or Cursor citation
            blocks. Uses a rough ~4 characters per token estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="context-input">Context paste</FieldLabel>
            <FieldContent>
              <Textarea
                id="context-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste agent context here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_CONTEXT_TEXT)
                toast.message("Loaded sample context.")
              }}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("")}
              disabled={!input}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Clear
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied section titles.",
                  formatContextSectionTitles(result),
                )
              }
              disabled={result.sections.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy titles
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatContextMarkdown(result),
                )
              }
              disabled={result.sections.length === 0}
            >
              Copy markdown
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budgets</CardTitle>
          <CardDescription>
            Click a budget to preview which largest sections still fit.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow
            label="Estimated tokens"
            value={`~${result.totalTokens.toLocaleString()}`}
          />
          <StatRow
            label="Characters"
            value={result.totalChars.toLocaleString()}
          />
          <StatRow label="Lines" value={result.totalLines.toLocaleString()} />
          <Separator />
          <div className="flex flex-col gap-4">
            {result.budgets.map((status) => {
              const active = status.budget.id === focusBudget
              return (
                <button
                  key={status.budget.id}
                  type="button"
                  onClick={() => setFocusBudget(status.budget.id)}
                  className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{status.budget.label}</span>
                    <Badge
                      variant={status.fits ? "secondary" : "destructive"}
                    >
                      {status.fits
                        ? `${status.fillPercent.toFixed(0)}% full`
                        : `over by ~${status.overBy.toLocaleString()}`}
                    </Badge>
                  </div>
                  <Progress value={Math.min(100, status.fillPercent)} />
                </button>
              )
            })}
          </div>
          {trimPlan && focusStatus && !focusStatus.fits ? (
            <p className="text-muted-foreground text-sm">
              To fit <strong>{focusStatus.budget.label}</strong>, keep the top{" "}
              {trimPlan.included.length} section(s) (~
              {trimPlan.tokens.toLocaleString()} tokens) and trim{" "}
              {result.sections.length - trimPlan.included.length} smaller or
              lower-priority block(s).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
          <CardDescription>
            Ranked by estimated token count — largest blocks are the best trim
            candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.ranked.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No sections yet. Paste context or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="text-right">Chars</TableHead>
                    {trimPlan && focusStatus && !focusStatus.fits ? (
                      <TableHead>Plan</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.ranked.map((section) => {
                    const kept = trimPlan?.included.some(
                      (item) => item.id === section.id,
                    )
                    return (
                      <TableRow key={section.id}>
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs">
                          {section.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{kindLabel(section.kind)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          ~{section.tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {section.lines}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {section.chars.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {trimPlan && focusStatus && !focusStatus.fits ? (
                            <Badge variant={kept ? "secondary" : "outline"}>
                              {kept ? "keep" : "trim"}
                            </Badge>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {result.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
