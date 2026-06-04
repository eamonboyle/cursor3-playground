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
import { SAMPLE_TSC_OUTPUT } from "@/lib/tsc/defaults"
import {
  diagnosticLocation,
  formatTscMarkdown,
  formatTscPaths,
  parseTscOutput,
} from "@/lib/tsc/parse"
import type { TscDiagnostic } from "@/lib/tsc/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  SourceCodeIcon,
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

function DiagnosticRow({
  diagnostic,
  onCopy,
}: {
  diagnostic: TscDiagnostic
  onCopy: (text: string) => void
}) {
  const loc = diagnosticLocation(diagnostic)
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        <Badge
          variant={diagnostic.severity === "error" ? "destructive" : "secondary"}
          className="mr-2"
        >
          {diagnostic.code}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs">
        {diagnostic.path ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {diagnostic.line ?? "—"}
      </TableCell>
      <TableCell className="text-sm">{diagnostic.message}</TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(loc)}
          aria-label={`Copy ${loc}`}
          disabled={!diagnostic.path}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function TscApp() {
  const [input, setInput] = React.useState(SAMPLE_TSC_OUTPUT)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)

  const result = React.useMemo(
    () => parseTscOutput(input, { hideNodeModules }),
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

  const topCodes = Object.entries(result.summary.byCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={SourceCodeIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              TypeScript diagnostic lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">tsc</code> or{" "}
              <code className="text-xs">pnpm typecheck</code> output — group by
              error code, filter node_modules, and copy file:line paths for
              Cursor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge
            variant={result.summary.errors > 0 ? "destructive" : "secondary"}
          >
            {result.summary.errors} error
            {result.summary.errors === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">{result.fileCount} file(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compiler output</CardTitle>
          <CardDescription>
            Supports classic{" "}
            <code className="text-xs">file(line,col): error TS…</code> and
            pretty{" "}
            <code className="text-xs">file:line:col - error TS…</code> formats,
            including ANSI-colored CI logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="tsc-output">Typecheck log</FieldLabel>
            <FieldContent>
              <Textarea
                id="tsc-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste tsc output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="tsc-hide-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel
                htmlFor="tsc-hide-modules"
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
                  setInput(SAMPLE_TSC_OUTPUT)
                  toast.message("Loaded sample typecheck output.")
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
                    formatTscPaths(result),
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
                    formatTscMarkdown(result),
                  )
                }
                disabled={result.diagnostics.length === 0}
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
          <StatRow label="Diagnostics" value={result.diagnostics.length} />
          <StatRow label="Unique locations" value={result.unique.length} />
          <StatRow label="Errors" value={result.summary.errors} />
          <StatRow label="Warnings" value={result.summary.warnings} />
          <StatRow label="Files touched" value={result.fileCount} />
          {topCodes.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {topCodes.map(([code, count]) => (
                <Badge key={code} variant="outline">
                  {code} × {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnostics</CardTitle>
          <CardDescription>
            Sorted in paste order — use copy on a row for a single location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.diagnostics.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No diagnostics yet. Paste typecheck output or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.diagnostics.map((d, index) => (
                    <DiagnosticRow
                      key={`${d.sourceLine}-${d.code}-${index}`}
                      diagnostic={d}
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
        Tip: run <code className="rounded bg-muted px-1">pnpm typecheck</code>{" "}
        locally, paste the log here, then copy paths into agent context.
      </p>
    </div>
  )
}
