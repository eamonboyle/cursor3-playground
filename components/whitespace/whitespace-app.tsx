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
import { SAMPLE_WHITESPACE_TEXT } from "@/lib/whitespace/defaults"
import {
  formatWhitespaceIssueLines,
  formatWhitespaceScanMarkdown,
  parseWhitespaceScan,
} from "@/lib/whitespace/parse"
import type { WhitespaceIssueKind } from "@/lib/whitespace/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  TextAlignLeftIcon,
} from "@hugeicons/core-free-icons"

const ISSUE_VARIANT: Record<
  WhitespaceIssueKind,
  "default" | "secondary" | "destructive" | "outline"
> = {
  "mixed-line-endings": "destructive",
  "trailing-whitespace": "secondary",
  "mixed-indent": "destructive",
  "invisible-char": "outline",
  "missing-final-newline": "secondary",
  "final-newline-only": "outline",
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

function lineEndingLabel(
  kind: ReturnType<typeof parseWhitespaceScan>["summary"]["lineEnding"],
): string {
  switch (kind) {
    case "lf":
      return "LF"
    case "crlf":
      return "CRLF"
    case "cr":
      return "CR"
    case "none":
      return "Mixed"
  }
}

export function WhitespaceApp() {
  const [input, setInput] = React.useState(SAMPLE_WHITESPACE_TEXT)

  const result = React.useMemo(() => parseWhitespaceScan(input), [input])

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
            icon={TextAlignLeftIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Whitespace lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Detect mixed line endings, trailing spaces, tab vs space indent,
              and invisible Unicode before noisy diffs or agent edits.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source snippet</CardTitle>
          <CardDescription>
            Paste a file fragment, diff hunk, or copied editor selection. All
            analysis runs locally in the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="whitespace-input">Text to scan</FieldLabel>
            <FieldContent>
              <Textarea
                id="whitespace-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
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
              onClick={() => setInput(SAMPLE_WHITESPACE_TEXT)}
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
                  "Copied markdown summary.",
                  formatWhitespaceScanMarkdown(result),
                )
              }
              disabled={!input.trim()}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy summary
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied issue lines.",
                  formatWhitespaceIssueLines(result),
                )
              }
              disabled={result.issues.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy line list
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result.warnings.map((warning) => (
            <p
              key={warning}
              className="text-muted-foreground text-sm leading-relaxed"
            >
              {warning}
            </p>
          ))}

          {input.trim() ? (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Lines" value={result.summary.lineCount} />
                <StatRow
                  label="Line endings"
                  value={
                    <>
                      {lineEndingLabel(result.summary.lineEnding)}
                      <span className="text-muted-foreground ml-1 text-[0.7rem]">
                        (LF {result.summary.lineEndingCounts.lf}, CRLF{" "}
                        {result.summary.lineEndingCounts.crlf}, CR{" "}
                        {result.summary.lineEndingCounts.cr})
                      </span>
                    </>
                  }
                />
                <StatRow label="Indent" value={result.summary.indent} />
                <StatRow
                  label="Trailing WS lines"
                  value={result.summary.trailingWhitespaceLines}
                />
                <StatRow
                  label="Invisible chars"
                  value={result.summary.invisibleCharCount}
                />
                <StatRow
                  label="Final newline"
                  value={result.summary.hasFinalNewline ? "yes" : "no"}
                />
              </div>

              {result.issues.length > 0 ? (
                <>
                  <Separator />
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kind</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Detail</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.issues.map((issue, index) => (
                          <TableRow key={`${issue.kind}-${index}`}>
                            <TableCell>
                              <Badge variant={ISSUE_VARIANT[issue.kind]}>
                                {issue.kind.replace(/-/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {issue.line !== undefined
                                ? issue.column !== undefined
                                  ? `${issue.line}:${issue.column}`
                                  : String(issue.line)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-md text-xs">
                              {issue.message}
                              {issue.detail ? (
                                <span className="text-foreground/70 block font-mono">
                                  {issue.detail}
                                </span>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
