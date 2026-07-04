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
import { SAMPLE_GIT_REFLOG } from "@/lib/reflog/defaults"
import {
  filterReflogEntries,
  formatReflogCheckoutCommands,
  formatReflogHashes,
  formatReflogMarkdown,
  formatReflogResetCommands,
  parseReflogOutput,
  reflogCheckoutCommand,
  reflogLocation,
  reflogResetCommand,
} from "@/lib/reflog/parse"
import type { ReflogEntry, ReflogOperation } from "@/lib/reflog/types"
import { REFLOG_OPERATIONS } from "@/lib/reflog/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

const OPERATION_OPTIONS: { value: ReflogOperation | "all"; label: string }[] =
  [
    { value: "all", label: "All operations" },
    ...REFLOG_OPERATIONS.map((op) => ({
      value: op,
      label: op,
    })),
  ]

function operationVariant(
  operation: ReflogOperation,
): "default" | "secondary" | "destructive" | "outline" {
  if (operation === "reset") {
    return "destructive"
  }
  if (operation === "commit") {
    return "default"
  }
  if (operation === "checkout" || operation === "branch") {
    return "outline"
  }
  return "secondary"
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

function EntryRow({
  entry,
  onCopy,
}: {
  entry: ReflogEntry
  onCopy: (text: string) => void
}) {
  const label = reflogLocation(entry)
  const description = entry.description || entry.action
  return (
    <TableRow>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.reflogIndex}
      </TableCell>
      <TableCell>
        <Badge
          variant={operationVariant(entry.operation)}
          className="font-mono text-[0.65rem]"
        >
          {entry.operation}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">{entry.shortHash}</TableCell>
      <TableCell
        className="max-w-[18rem] truncate text-xs"
        title={description}
      >
        {description}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(reflogResetCommand(entry))}
            aria-label={`Copy reset command for ${label}`}
            title="Copy git reset --hard"
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(reflogCheckoutCommand(entry))}
            aria-label={`Copy checkout command for ${entry.shortHash}`}
            title="Copy git checkout"
          >
            <span className="font-mono text-[0.6rem]">co</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ReflogApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_REFLOG)
  const [filter, setFilter] = React.useState<ReflogOperation | "all">("all")

  const result = React.useMemo(() => parseReflogOutput(input), [input])
  const visible = React.useMemo(
    () => filterReflogEntries(result.entries, { operationFilter: filter }),
    [result.entries, filter],
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
            icon={Clock01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git reflog lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git reflog</code> — trace HEAD
              movements after resets or checkouts, then copy{" "}
              <code className="text-xs">git reset --hard HEAD@{"{n}"}</code> or
              checkout commands to recover lost commits.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="outline">{result.summary.entryCount} entry(ies)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reflog output</CardTitle>
          <CardDescription>
            Run <code className="text-xs">git reflog</code> or{" "}
            <code className="text-xs">git reflog show HEAD</code> after a bad
            reset, rebase, or checkout to find a recovery point.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="reflog-input">Git reflog log</FieldLabel>
            <FieldContent>
              <Textarea
                id="reflog-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git reflog output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="reflog-filter">Operation</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) =>
                  setFilter(v as ReflogOperation | "all")
                }
              >
                <SelectTrigger id="reflog-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_REFLOG)
                  toast.message("Loaded sample reflog.")
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
                    "Copied reset commands.",
                    formatReflogResetCommands(result, {
                      operationFilter: filter,
                    }),
                  )
                }
                disabled={visible.length === 0}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy reset
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied checkout commands.",
                    formatReflogCheckoutCommands(result, {
                      operationFilter: filter,
                    }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy checkout
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied commit hashes.",
                    formatReflogHashes(result),
                  )
                }
                disabled={result.entries.length === 0}
              >
                Copy hashes
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatReflogMarkdown(result),
                  )
                }
                disabled={result.entries.length === 0}
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
          <StatRow label="Total entries" value={result.summary.entryCount} />
          {REFLOG_OPERATIONS.map((op) =>
            result.summary.byOperation[op] > 0 ? (
              <StatRow
                key={op}
                label={op}
                value={result.summary.byOperation[op]}
              />
            ) : null,
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entries</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Newest first — HEAD@{0} is the latest movement."
              : `Showing ${filter} operations only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No reflog rows in this filter. Paste output or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <EntryRow
                      key={`${entry.hash}-${entry.reflogIndex}-${entry.sourceLine}`}
                      entry={entry}
                      onCopy={(text) => void copyText("Copied command.", text)}
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
        Tip: after <code className="rounded bg-muted px-1">git reset --hard</code>{" "}
        or a detached checkout, run{" "}
        <code className="rounded bg-muted px-1">git reflog</code>, find the
        entry before the mistake, and copy its reset command here.
      </p>
    </div>
  )
}
