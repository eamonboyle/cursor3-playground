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
import {
  SAMPLE_GIT_BRANCH_PLAIN,
  SAMPLE_GIT_BRANCH_VERBOSE,
} from "@/lib/branches/defaults"
import {
  branchCheckoutCommand,
  filterBranchEntries,
  formatBranchCheckoutCommands,
  formatBranchDeleteCommands,
  formatBranchMarkdown,
  formatBranchNames,
  formatBranchPruneHint,
  parseBranchOutput,
} from "@/lib/branches/parse"
import type { BranchEntry, BranchFilter } from "@/lib/branches/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: BranchFilter; label: string }[] = [
  { value: "all", label: "All branches" },
  { value: "local", label: "Local only" },
  { value: "remote", label: "Remote only" },
  { value: "current", label: "Current branch" },
  { value: "gone", label: "Gone upstream" },
  { value: "ahead", label: "Ahead of remote" },
  { value: "behind", label: "Behind remote" },
]

function trackingLabel(entry: BranchEntry): string {
  if (entry.trackingState === "none") {
    return "—"
  }
  if (entry.trackingState === "gone") {
    return entry.tracking ? `${entry.tracking} (gone)` : "gone"
  }
  const parts: string[] = []
  if (entry.tracking) {
    parts.push(entry.tracking)
  }
  if (entry.ahead !== undefined) {
    parts.push(`ahead ${entry.ahead}`)
  }
  if (entry.behind !== undefined) {
    parts.push(`behind ${entry.behind}`)
  }
  return parts.join(", ") || entry.trackingState
}

function trackingVariant(
  entry: BranchEntry,
): "default" | "secondary" | "destructive" | "outline" {
  if (entry.trackingState === "gone") {
    return "destructive"
  }
  if (entry.trackingState === "ahead" || entry.trackingState === "diverged") {
    return "default"
  }
  if (entry.trackingState === "behind") {
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

function BranchRow({
  entry,
  onCopy,
}: {
  entry: BranchEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {entry.isCurrent ? "*" : entry.isMerged ? "+" : ""}
      </TableCell>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs" title={entry.name}>
        {entry.displayName}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono text-[0.65rem]">
          {entry.kind}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.hash?.slice(0, 7) ?? "—"}
      </TableCell>
      <TableCell>
        <Badge
          variant={trackingVariant(entry)}
          className="max-w-[12rem] truncate font-mono text-[0.65rem]"
          title={trackingLabel(entry)}
        >
          {trackingLabel(entry)}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate text-xs text-muted-foreground">
        {entry.subject ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(branchCheckoutCommand(entry))}
            aria-label={`Copy checkout for ${entry.name}`}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function BranchesApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_BRANCH_VERBOSE)
  const [filter, setFilter] = React.useState<BranchFilter>("all")

  const result = React.useMemo(() => parseBranchOutput(input), [input])
  const visible = React.useMemo(
    () => filterBranchEntries(result.entries, filter),
    [result.entries, filter],
  )
  const pruneHint = React.useMemo(() => formatBranchPruneHint(result), [result])

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
            icon={GitBranchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git branches lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git branch -vv</code> or{" "}
              <code className="text-xs">git branch -a</code> — list local and
              remote branches, spot gone upstreams, copy checkout and delete
              commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          {result.summary.current ? (
            <Badge variant="secondary">{result.summary.current}</Badge>
          ) : null}
          <Badge variant="outline">{result.format} format</Badge>
          <Badge variant="outline">{result.summary.total} branch(es)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch listing</CardTitle>
          <CardDescription>
            <code className="text-xs">git branch -vv</code> includes tracking
            info and ahead/behind counts. Plain{" "}
            <code className="text-xs">git branch -a</code> lists names only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="branches-input">Git branch output</FieldLabel>
            <FieldContent>
              <Textarea
                id="branches-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git branch output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-48">
              <FieldLabel htmlFor="branches-filter">Show</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as BranchFilter)}
              >
                <SelectTrigger id="branches-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map((opt) => (
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
                  setInput(SAMPLE_GIT_BRANCH_VERBOSE)
                  toast.message("Loaded verbose sample.")
                }}
              >
                Verbose sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_BRANCH_PLAIN)
                  toast.message("Loaded plain sample.")
                }}
              >
                Plain sample
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
                    "Copied branch names.",
                    formatBranchNames(result, { filter }),
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
                Copy names
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied checkout commands.",
                    formatBranchCheckoutCommands(result, { filter }),
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
                    "Copied delete commands.",
                    formatBranchDeleteCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy delete
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText("Copied prune workflow.", pruneHint)
                }
                disabled={!pruneHint}
              >
                Copy prune
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatBranchMarkdown(result),
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
          <StatRow label="Total" value={result.summary.total} />
          <StatRow label="Local" value={result.summary.local} />
          <StatRow label="Remote" value={result.summary.remote} />
          <StatRow label="Gone upstream" value={result.summary.gone} />
          <StatRow label="Ahead of remote" value={result.summary.ahead} />
          <StatRow label="Behind remote" value={result.summary.behind} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branches</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "All parsed rows — * marks current, + marks merged."
              : `Showing ${filter} branches only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No branches in this filter. Paste branch output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-6" />
                    <TableHead>Branch</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry, index) => (
                    <BranchRow
                      key={`${entry.name}-${entry.sourceLine}-${index}`}
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
        Tip: run{" "}
        <code className="rounded bg-muted px-1">git branch -vv</code> before
        cleaning up stale branches, paste here, then copy prune and delete
        commands for agent context.
      </p>
    </div>
  )
}
