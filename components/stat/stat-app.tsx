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
import { Input } from "@/components/ui/input"
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
  SAMPLE_DIFF_NUMSTAT,
  SAMPLE_DIFF_STAT,
} from "@/lib/stat/defaults"
import {
  fileChurn,
  formatStatMarkdown,
  formatStatPaths,
  formatStatPrScope,
  parseDiffStatOutput,
  sortByChurn,
} from "@/lib/stat/parse"
import type { StatFileEntry } from "@/lib/stat/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChartBarLineIcon,
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

function FileRow({
  file,
  onCopy,
}: {
  file: StatFileEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs">
        {file.path}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
        {file.binary ? "—" : `+${file.additions}`}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums text-rose-600 dark:text-rose-400">
        {file.binary ? "—" : `-${file.deletions}`}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {file.binary ? (
          <Badge variant="outline">binary</Badge>
        ) : (
          fileChurn(file)
        )}
      </TableCell>
      <TableCell>
        <Badge variant={file.exact ? "secondary" : "outline"}>
          {file.exact ? "exact" : "scaled"}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(file.path)}
          aria-label={`Copy ${file.path}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function StatApp() {
  const [input, setInput] = React.useState(SAMPLE_DIFF_STAT)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)
  const [extensionFilter, setExtensionFilter] = React.useState("")

  const result = React.useMemo(
    () =>
      parseDiffStatOutput(input, {
        hideNodeModules,
        extensionFilter,
      }),
    [input, hideNodeModules, extensionFilter],
  )

  const sortedFiles = React.useMemo(
    () => sortByChurn(result.files),
    [result.files],
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
            icon={ChartBarLineIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Diff stat lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git diff --stat</code> or{" "}
              <code className="text-xs">--numstat</code> — rank files by churn,
              filter extensions, copy PR scope summaries.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.fileCount} file
            {result.summary.fileCount === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">
            +{result.summary.additions} / -{result.summary.deletions}
          </Badge>
          {result.format !== "unknown" ? (
            <Badge variant="outline">{result.format}</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diff output</CardTitle>
          <CardDescription>
            Supports <code className="text-xs">--stat</code> bar graphs, exact{" "}
            <code className="text-xs">--numstat</code> tables, and trailing{" "}
            <code className="text-xs">--shortstat</code> summary lines from{" "}
            <code className="text-xs">git show --stat</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="stat-output">Git stat log</FieldLabel>
            <FieldContent>
              <Textarea
                id="stat-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git diff --stat output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="stat-hide-modules"
                  checked={hideNodeModules}
                  onCheckedChange={setHideNodeModules}
                />
                <FieldLabel
                  htmlFor="stat-hide-modules"
                  className="mb-0 cursor-pointer"
                >
                  Hide node_modules
                </FieldLabel>
              </div>
              <Field className="w-36">
                <FieldLabel htmlFor="stat-ext" className="sr-only">
                  Extension filter
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="stat-ext"
                    value={extensionFilter}
                    onChange={(e) => setExtensionFilter(e.target.value)}
                    placeholder=".ts"
                    className="font-mono text-xs"
                  />
                </FieldContent>
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_DIFF_STAT)
                  toast.message("Loaded --stat sample.")
                }}
              >
                Load --stat
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_DIFF_NUMSTAT)
                  toast.message("Loaded --numstat sample.")
                }}
              >
                Load --numstat
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
                    "Copied paths (largest churn first).",
                    formatStatPaths(result),
                  )
                }
                disabled={result.files.length === 0}
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
                    "Copied PR scope markdown.",
                    formatStatPrScope(result),
                  )
                }
                disabled={result.files.length === 0}
              >
                Copy PR scope
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatStatMarkdown(result),
                  )
                }
                disabled={result.files.length === 0}
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
          <StatRow label="Files" value={result.summary.fileCount} />
          <StatRow label="Insertions" value={`+${result.summary.additions}`} />
          <StatRow label="Deletions" value={`-${result.summary.deletions}`} />
          <StatRow label="Binary files" value={result.summary.binaryCount} />
          {result.summary.reportedFileCount !== undefined ? (
            <StatRow
              label="Reported in summary"
              value={`${result.summary.reportedFileCount} files, +${result.summary.reportedAdditions ?? 0}/-${result.summary.reportedDeletions ?? 0}`}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files by churn</CardTitle>
          <CardDescription>
            Sorted by additions + deletions — largest diffs first for review
            scope.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedFiles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No file stats yet. Paste diff stat output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>+</TableHead>
                    <TableHead>−</TableHead>
                    <TableHead>Churn</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiles.map((file) => (
                    <FileRow
                      key={`${file.sourceLine}-${file.path}`}
                      file={file}
                      onCopy={(text) => void copyText("Copied path.", text)}
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
        <code className="rounded bg-muted px-1">
          git diff --numstat main...HEAD
        </code>{" "}
        for exact counts, then copy the largest paths into agent context.
      </p>
    </div>
  )
}
