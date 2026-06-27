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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { SAMPLE_CONTEXT_INPUT } from "@/lib/context/defaults"
import {
  formatContextMarkdown,
  formatLargestSectionLabels,
  parseContextInput,
} from "@/lib/context/parse"
import { loadContextPersisted, saveContextPersisted } from "@/lib/context/storage"
import type { ContextBudgetStatus, ContextPersisted, TokenEstimateMethod } from "@/lib/context/types"
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

function budgetVariant(status: ContextBudgetStatus) {
  if (status === "over") {
    return "destructive" as const
  }
  if (status === "warn") {
    return "secondary" as const
  }
  return "outline" as const
}

export function ContextApp() {
  const [persist, setPersist] = React.useState<ContextPersisted>(() => ({
    input: SAMPLE_CONTEXT_INPUT,
    tokenMethod: "chars",
    budgetLimit: 32_000,
  }))
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    setPersist(loadContextPersisted())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveContextPersisted(persist)
  }, [persist])

  const result = React.useMemo(
    () =>
      parseContextInput(persist.input, {
        tokenMethod: persist.tokenMethod,
      }),
    [persist.input, persist.tokenMethod],
  )

  function setInput(input: string) {
    setPersist((p) => ({ ...p, input }))
  }

  function setTokenMethod(tokenMethod: TokenEstimateMethod) {
    setPersist((p) => ({ ...p, tokenMethod }))
  }

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

  const activeBudget = result.budgets.find(
    (b) => b.limit === persist.budgetLimit,
  )

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
              Estimate token usage for pasted agent context — split by Cursor
              citation fences or file delimiters, rank largest sections, and
              check common model budgets.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            ~{result.summary.tokens.toLocaleString()} tokens
          </Badge>
          <Badge variant="outline">
            {result.summary.sectionCount} section
            {result.summary.sectionCount === 1 ? "" : "s"}
          </Badge>
          {activeBudget ? (
            <Badge variant={budgetVariant(activeBudget.status)}>
              {activeBudget.label} budget: {activeBudget.status}
            </Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent context</CardTitle>
          <CardDescription>
            Paste multi-file context with{" "}
            <code className="text-xs">```start:end:filepath</code> fences or{" "}
            <code className="text-xs">--- path ---</code> delimiters.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="context-input">Context paste</FieldLabel>
            <FieldContent>
              <Textarea
                id="context-input"
                value={persist.input}
                onChange={(e) => setInput(e.target.value)}
                rows={16}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste agent context here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-4">
            <Field className="max-w-xs">
              <FieldLabel htmlFor="context-token-method">
                Token estimate
              </FieldLabel>
              <FieldContent>
                <Select
                  value={persist.tokenMethod}
                  onValueChange={(v) =>
                    setTokenMethod(v as TokenEstimateMethod)
                  }
                >
                  <SelectTrigger id="context-token-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chars">Chars ÷ 4</SelectItem>
                    <SelectItem value="words">Words ÷ 0.75</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field className="max-w-xs">
              <FieldLabel htmlFor="context-budget">Highlight budget</FieldLabel>
              <FieldContent>
                <Select
                  value={String(persist.budgetLimit)}
                  onValueChange={(v) =>
                    setPersist((p) => ({
                      ...p,
                      budgetLimit: Number(v),
                    }))
                  }
                >
                  <SelectTrigger id="context-budget">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8000">8k tokens</SelectItem>
                    <SelectItem value="32000">32k tokens</SelectItem>
                    <SelectItem value="128000">128k tokens</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_CONTEXT_INPUT)
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
              disabled={!persist.input}
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
                  "Copied largest section paths.",
                  formatLargestSectionLabels(result),
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
              Copy largest paths
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
          <CardTitle className="text-base">Totals</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow
            label="Estimated tokens"
            value={`~${result.summary.tokens.toLocaleString()}`}
          />
          <StatRow
            label="Characters"
            value={result.summary.chars.toLocaleString()}
          />
          <StatRow
            label="Lines"
            value={result.summary.lines.toLocaleString()}
          />
          <StatRow
            label="Words"
            value={result.summary.words.toLocaleString()}
          />
          <StatRow
            label="Largest section"
            value={result.summary.largestSection ?? "—"}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {result.budgets.map((row) => (
              <Badge key={row.label} variant={budgetVariant(row.status)}>
                {row.label}: {row.headroom >= 0 ? "+" : ""}
                {row.headroom.toLocaleString()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections by size</CardTitle>
          <CardDescription>
            Sorted largest first — trim the top rows to shrink agent context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No content yet. Paste agent context or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="text-right">Chars</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.sections.map((section) => (
                    <TableRow key={section.label}>
                      <TableCell className="max-w-[14rem] truncate font-mono text-xs">
                        {section.label}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        ~{section.tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {section.percentOfTotal}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {section.lines}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {section.chars.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
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
              {result.warnings.map((w, i) => (
                <li key={`${w}-${i}`}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Tip: before pasting a large repo slice into an agent, run this lab to see
        which files dominate context and whether you are near a model limit.
      </p>
    </div>
  )
}
