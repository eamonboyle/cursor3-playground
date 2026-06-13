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
import { SAMPLE_PLAYWRIGHT_OUTPUT } from "@/lib/playwright/defaults"
import {
  failureLocation,
  formatPlaywrightMarkdown,
  formatPlaywrightPaths,
  parsePlaywrightOutput,
} from "@/lib/playwright/parse"
import type { PlaywrightFailure } from "@/lib/playwright/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BrowserIcon,
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

function FailureRow({
  failure,
  onCopy,
}: {
  failure: PlaywrightFailure
  onCopy: (text: string) => void
}) {
  const loc = failureLocation(failure)
  const label = failure.suite ? `${failure.suite} › ${failure.name}` : failure.name
  return (
    <TableRow>
      <TableCell>
        {failure.project ? (
          <Badge variant="outline" className="font-mono text-[0.65rem]">
            {failure.project}
          </Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="max-w-[9rem] truncate font-mono text-xs">
        {failure.path ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {failure.line ?? "—"}
      </TableCell>
      <TableCell className="text-sm">{label}</TableCell>
      <TableCell className="max-w-[12rem] truncate text-muted-foreground text-xs">
        {failure.message ?? "—"}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(loc)}
          aria-label={`Copy ${loc}`}
          disabled={!failure.path}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function PlaywrightApp() {
  const [input, setInput] = React.useState(SAMPLE_PLAYWRIGHT_OUTPUT)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)

  const result = React.useMemo(
    () => parsePlaywrightOutput(input, { hideNodeModules }),
    [input, hideNodeModules],
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

  const topFiles = Object.entries(result.summary.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const topProjects = Object.entries(result.summary.byProject)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={BrowserIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Playwright output lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">playwright test</code> logs —
              extract failed specs by browser project, filter node_modules, and
              copy file:line paths for Cursor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge
            variant={result.summary.failed > 0 ? "destructive" : "secondary"}
          >
            {result.summary.failed} failure
            {result.summary.failed === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">{result.fileCount} file(s)</Badge>
          {result.summary.total !== undefined ? (
            <Badge variant="outline">
              {result.summary.passed ?? 0}/{result.summary.total} passed
            </Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Playwright log</CardTitle>
          <CardDescription>
            Supports inline <code className="text-xs">✘</code> run lines,
            numbered <code className="text-xs">1) [project] › path:line:col › …</code>{" "}
            blocks, stack <code className="text-xs">at file:line:col</code>{" "}
            frames, and <code className="text-xs">N failed</code> summaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="playwright-output">Runner output</FieldLabel>
            <FieldContent>
              <Textarea
                id="playwright-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste Playwright test output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="playwright-hide-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel
                htmlFor="playwright-hide-modules"
                className="mb-0 cursor-pointer"
              >
                Hide node_modules
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_PLAYWRIGHT_OUTPUT)
                  toast.message("Loaded sample Playwright output.")
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
                    "Copied paths (one per line).",
                    formatPlaywrightPaths(result),
                  )
                }
                disabled={result.unique.length === 0}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy paths
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatPlaywrightMarkdown(result),
                  )
                }
                disabled={result.failures.length === 0}
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
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow label="Failures parsed" value={result.failures.length} />
          <StatRow label="Unique locations" value={result.unique.length} />
          {result.summary.total !== undefined ? (
            <StatRow label="Runner total" value={result.summary.total} />
          ) : null}
          {result.summary.passed !== undefined ? (
            <StatRow label="Runner passed" value={result.summary.passed} />
          ) : null}
          <StatRow label="Files touched" value={result.fileCount} />
          {topProjects.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {topProjects.map(([project, count]) => (
                <Badge key={project} variant="secondary">
                  {project} × {count}
                </Badge>
              ))}
            </div>
          ) : null}
          {topFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {topFiles.map(([path, count]) => (
                <Badge key={path} variant="outline" className="max-w-full truncate">
                  {path.split("/").pop()} × {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failures</CardTitle>
          <CardDescription>
            Sorted in paste order — stack frames override test declaration lines
            when available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.failures.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No failures yet. Paste Playwright output or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Hint</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.failures.map((f, index) => (
                    <FailureRow
                      key={`${f.sourceLine}-${f.name}-${f.project ?? ""}-${index}`}
                      failure={f}
                      onCopy={(text) => void copyText("Copied location.", text)}
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
              {result.warnings.map((w, i) => (
                <li key={`${w}-${i}`}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Tip: run{" "}
        <code className="rounded bg-muted px-1">pnpm exec playwright test</code>{" "}
        locally, paste the log here, then copy paths into agent context.
      </p>
    </div>
  )
}
