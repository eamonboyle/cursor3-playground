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
import { SAMPLE_CONTEXT_INPUT } from "@/lib/context/defaults"
import {
  formatContextLargestLabels,
  formatContextMarkdown,
  parseContextSize,
  sortSectionsByTokens,
} from "@/lib/context/parse"
import type { ContextSectionKind } from "@/lib/context/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

const KIND_VARIANT: Record<
  ContextSectionKind,
  "default" | "secondary" | "outline"
> = {
  citation: "default",
  "path-header": "secondary",
  chunk: "outline",
}

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

export function ContextApp() {
  const [input, setInput] = React.useState(SAMPLE_CONTEXT_INPUT)

  const result = React.useMemo(() => parseContextSize(input), [input])
  const ranked = React.useMemo(
    () => sortSectionsByTokens(result.sections),
    [result.sections],
  )

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
              Estimate token usage for pasted agent context — split by citation
              fences or path headers, rank sections, and compare 8k / 32k /
              128k budgets.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent context</CardTitle>
          <CardDescription>
            Paste a prompt, file dump, or mix of{" "}
            <code className="text-xs">```start:end:filepath```</code> citations
            and <code className="text-xs">--- path ---</code> headers. Token
            counts use a ~4 chars/token heuristic.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="context-input">Context input</FieldLabel>
            <FieldContent>
              <Textarea
                id="context-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={16}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_CONTEXT_INPUT)}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("")}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Clear
            </Button>
          </div>

          {result.warnings.length > 0 && (
            <div className="text-muted-foreground text-sm">
              {result.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>
            Rough token totals for trimming context before sending to an agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow
            label="Estimated tokens"
            value={`~${result.summary.totalTokens.toLocaleString()}`}
          />
          <StatRow
            label="Characters"
            value={result.summary.totalChars.toLocaleString()}
          />
          <StatRow label="Sections" value={result.summary.sectionCount} />

          <Separator />

          <div className="flex flex-col gap-3">
            {result.budgets.map((budget) => (
              <div key={budget.limit} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {budget.label} budget
                  </span>
                  <span className="font-mono text-[0.8rem] tabular-nums">
                    {budget.percentUsed}%
                    {budget.exceeded ? (
                      <Badge variant="destructive" className="ml-2">
                        over
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        ok
                      </Badge>
                    )}
                  </span>
                </div>
                <Progress
                  value={Math.min(budget.percentUsed, 100)}
                  className={budget.exceeded ? "opacity-80" : undefined}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                copyText("Summary copied", formatContextMarkdown(result))
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Copy markdown summary
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                copyText(
                  "Largest sections copied",
                  formatContextLargestLabels(result),
                )
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Copy largest sections
            </Button>
          </div>
        </CardContent>
      </Card>

      {ranked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sections by size</CardTitle>
            <CardDescription>
              Largest blocks first — trim or move these when nearing a context
              limit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Line</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((section) => (
                  <TableRow key={`${section.kind}-${section.label}-${section.sourceStartLine}`}>
                    <TableCell className="max-w-[14rem] truncate font-mono text-xs">
                      {section.label}
                    </TableCell>
                    <TableCell>
                      <Badge variant={KIND_VARIANT[section.kind]}>
                        {section.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      ~{section.tokenEstimate.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {section.sourceStartLine}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
