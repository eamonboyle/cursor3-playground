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
import {
  SAMPLE_SNAPSHOT_JEST,
  SAMPLE_SNAPSHOT_VITEST,
} from "@/lib/snapshot/defaults"
import {
  formatSnapshotMarkdown,
  formatSnapshotPaths,
  formatSnapshotUpdateCommand,
  parseSnapshotOutput,
  snapshotLocation,
} from "@/lib/snapshot/parse"
import type { SnapshotFailureKind } from "@/lib/snapshot/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons"

const KIND_VARIANT: Record<
  SnapshotFailureKind,
  "default" | "secondary" | "destructive" | "outline"
> = {
  mismatch: "destructive",
  obsolete: "outline",
  new: "secondary",
  inline: "outline",
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

export function SnapshotApp() {
  const [input, setInput] = React.useState(SAMPLE_SNAPSHOT_JEST)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)

  const result = React.useMemo(
    () => parseSnapshotOutput(input, { hideNodeModules }),
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

  const fileRows = Object.entries(result.summary.byFile).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Image01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Snapshot lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste Jest or Vitest snapshot failure output — list mismatches,
              obsolete <code className="text-xs">.snap</code> files, and copy
              update commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          {result.summary.failed > 0 && (
            <Badge variant="destructive">
              {result.summary.failed} failed
            </Badge>
          )}
          {result.summary.obsolete > 0 && (
            <Badge variant="outline">
              {result.summary.obsolete} obsolete
            </Badge>
          )}
          {result.failures.length > 0 && (
            <Badge variant="secondary">
              {result.failures.length} parsed
            </Badge>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test output</CardTitle>
          <CardDescription>
            Run <code className="text-xs">pnpm test</code> after a UI change and
            paste the snapshot failure block, or load a Jest / Vitest sample.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="snapshot-input">Snapshot log</FieldLabel>
            <FieldContent>
              <Textarea
                id="snapshot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={16}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="hide-node-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <label
                htmlFor="hide-node-modules"
                className="text-muted-foreground text-sm"
              >
                Hide node_modules
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_SNAPSHOT_JEST)}
            >
              Load Jest sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_SNAPSHOT_VITEST)}
            >
              Load Vitest sample
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
                  formatSnapshotMarkdown(result),
                )
              }
              disabled={
                result.failures.length === 0 && result.summary.failed === 0
              }
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
                  "Copied test and snap paths.",
                  formatSnapshotPaths(result),
                )
              }
              disabled={result.failures.length === 0}
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
                  "Copied update command.",
                  formatSnapshotUpdateCommand(),
                )
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy -u command
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <p
                  key={warning}
                  className="text-muted-foreground text-sm leading-relaxed"
                >
                  {warning}
                </p>
              ))}
            </div>
          )}

          {(result.failures.length > 0 || result.summary.failed > 0) && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Parsed rows" value={result.summary.total} />
                {result.summary.failed > 0 && (
                  <StatRow label="Failed (summary)" value={result.summary.failed} />
                )}
                {result.summary.obsolete > 0 && (
                  <StatRow
                    label="Obsolete (summary)"
                    value={result.summary.obsolete}
                  />
                )}
                {result.summary.updated > 0 && (
                  <StatRow label="Updated" value={result.summary.updated} />
                )}
                {result.summary.written > 0 && (
                  <StatRow label="Written" value={result.summary.written} />
                )}
                {fileRows.map(([file, count]) => (
                  <StatRow key={file} label={file} value={count} />
                ))}
              </div>

              {result.failures.length > 0 && (
                <>
                  <Separator />

                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kind</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Snapshot</TableHead>
                          <TableHead>Diff</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.failures.map((failure, index) => (
                          <TableRow key={`${failure.sourceLine}-${index}`}>
                            <TableCell>
                              <Badge variant={KIND_VARIANT[failure.kind]}>
                                {failure.kind}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[10rem] truncate font-mono text-xs sm:max-w-md">
                              {snapshotLocation(failure)}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[8rem] truncate text-xs sm:max-w-xs">
                              {failure.snapshotName ?? failure.snapshotPath ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs tabular-nums">
                              {failure.removedLines !== undefined ||
                              failure.addedLines !== undefined
                                ? `−${failure.removedLines ?? 0}/+${failure.addedLines ?? 0}`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
