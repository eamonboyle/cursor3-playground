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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_GH_PR_CHECKS, SAMPLE_STATUS_LINES } from "@/lib/checks/defaults"
import {
  checkStatusLabel,
  formatCheckUrls,
  formatChecksMarkdown,
  formatFailingCheckNames,
  formatRerunHints,
  parseChecksOutput,
} from "@/lib/checks/parse"
import type { CheckStatus, CiCheck } from "@/lib/checks/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  WorkflowSquare01Icon,
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

function statusBadgeVariant(
  status: CheckStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "fail":
      return "destructive"
    case "pass":
      return "default"
    case "pending":
      return "secondary"
    case "skipped":
    case "cancelled":
      return "outline"
    case "unknown":
      return "outline"
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

function CheckRow({
  check,
  onCopy,
}: {
  check: CiCheck
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant={statusBadgeVariant(check.status)}>
          {checkStatusLabel(check.status)}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs">
        {check.name}
      </TableCell>
      <TableCell className="max-w-[16rem] truncate text-xs">
        {check.description ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {check.elapsed ?? "—"}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(check.url ?? check.name)}
          aria-label={`Copy ${check.name}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function ChecksApp() {
  const [input, setInput] = React.useState(SAMPLE_GH_PR_CHECKS)
  const [hideSkipped, setHideSkipped] = React.useState(true)

  const result = React.useMemo(
    () => parseChecksOutput(input, { hideSkipped }),
    [input, hideSkipped],
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

  const hasFailures = result.summary.fail > 0

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={WorkflowSquare01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              CI checks lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">gh pr checks</code>, GitHub
              Actions summaries, or JSON — group by status and copy failing job
              names or rerun hints.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant={hasFailures ? "destructive" : "secondary"}>
            {result.summary.fail} failing
          </Badge>
          <Badge variant="outline">{result.summary.pass} passing</Badge>
          {result.summary.pending > 0 ? (
            <Badge variant="secondary">{result.summary.pending} pending</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check output</CardTitle>
          <CardDescription>
            Supports `gh pr checks` tables, GitHub Actions status lines, compact
            `name: fail` rows, and `gh pr checks --json`.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="checks-output">CI log</FieldLabel>
            <FieldContent>
              <Textarea
                id="checks-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste gh pr checks output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="checks-hide-skipped"
                checked={hideSkipped}
                onCheckedChange={setHideSkipped}
              />
              <FieldLabel
                htmlFor="checks-hide-skipped"
                className="mb-0 cursor-pointer"
              >
                Hide skipped / cancelled
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GH_PR_CHECKS)
                  toast.message("Loaded gh pr checks sample.")
                }}
              >
                gh pr checks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_STATUS_LINES)
                  toast.message("Loaded Actions summary sample.")
                }}
              >
                Actions summary
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
                    "Copied failing check names.",
                    formatFailingCheckNames(result),
                  )
                }
                disabled={!hasFailures}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy failures
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied rerun hints.",
                    formatRerunHints(result),
                  )
                }
                disabled={!hasFailures}
              >
                Rerun hints
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatChecksMarkdown(result),
                  )
                }
                disabled={result.checks.length === 0}
              >
                Copy markdown
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          {result.headline ? (
            <CardDescription>{result.headline}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow label="Checks listed" value={result.checks.length} />
          <StatRow label="Failing" value={result.summary.fail} />
          <StatRow label="Passing" value={result.summary.pass} />
          <StatRow label="Pending" value={result.summary.pending} />
          <StatRow label="Skipped" value={result.summary.skipped} />
          <StatRow label="Cancelled" value={result.summary.cancelled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checks</CardTitle>
          <CardDescription>
            Sorted in paste order — copy a row for the job URL or name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.checks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No checks yet. Paste CI output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Elapsed</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.checks.map((check, index) => (
                    <CheckRow
                      key={`${check.sourceLine}-${check.name}-${index}`}
                      check={check}
                      onCopy={(text) => void copyText("Copied.", text)}
                    />
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
              {result.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Tip: run{" "}
        <code className="rounded bg-muted px-1">gh pr checks</code> after
        pushing, paste the table here, then copy failing job names for agent
        context. Job URLs:{" "}
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() =>
            void copyText("Copied job URLs.", formatCheckUrls(result))
          }
          disabled={result.checks.every((check) => !check.url)}
        >
          copy all
        </button>
        .
      </p>
    </div>
  )
}
