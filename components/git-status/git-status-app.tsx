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
  SAMPLE_GIT_STATUS_HUMAN,
  SAMPLE_GIT_STATUS_PORCELAIN,
} from "@/lib/git-status/defaults"
import {
  entryDisplayPath,
  filterGitStatusEntries,
  formatGitAddCommands,
  formatGitStatusMarkdown,
  formatGitStatusPaths,
  parseGitStatus,
} from "@/lib/git-status/parse"
import type { GitStatusBucket, GitStatusEntry } from "@/lib/git-status/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons"

const BUCKET_OPTIONS: { value: GitStatusBucket | "all"; label: string }[] = [
  { value: "all", label: "All files" },
  { value: "staged", label: "Staged" },
  { value: "unstaged", label: "Unstaged" },
  { value: "untracked", label: "Untracked" },
  { value: "conflicted", label: "Conflicted" },
  { value: "ignored", label: "Ignored" },
]

function bucketVariant(
  bucket: GitStatusBucket,
): "default" | "secondary" | "destructive" | "outline" {
  if (bucket === "conflicted") {
    return "destructive"
  }
  if (bucket === "staged") {
    return "default"
  }
  if (bucket === "untracked") {
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
  entry: GitStatusEntry
  onCopy: (text: string) => void
}) {
  const path = entryDisplayPath(entry)
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {entry.buckets.map((bucket) => (
            <Badge
              key={bucket}
              variant={bucketVariant(bucket)}
              className="font-mono text-[0.65rem]"
            >
              {bucket}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono text-[0.65rem]">
          {entry.kind}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={path}>
        {path}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.indexCode ?? "—"}
        {entry.worktreeCode ?? ""}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(path)}
          aria-label={`Copy ${path}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function GitStatusApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_STATUS_PORCELAIN)
  const [filter, setFilter] = React.useState<GitStatusBucket | "all">("all")

  const result = React.useMemo(() => parseGitStatus(input), [input])
  const visible = React.useMemo(
    () => filterGitStatusEntries(result.entries, filter),
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
            icon={GitBranchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git status lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git status</code> or{" "}
              <code className="text-xs">git status --porcelain</code> — group
              staged, unstaged, and untracked files, then copy paths or{" "}
              <code className="text-xs">git add</code> commands for agent
              context.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          {result.branch ? (
            <Badge variant="secondary">{result.branch}</Badge>
          ) : null}
          <Badge variant="outline">{result.format} format</Badge>
          <Badge variant="outline">{result.summary.total} file(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status output</CardTitle>
          <CardDescription>
            Porcelain v1 is the most reliable. Human-readable sections from a
            plain <code className="text-xs">git status</code> also work.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="git-status-input">Git status log</FieldLabel>
            <FieldContent>
              <Textarea
                id="git-status-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git status output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-48">
              <FieldLabel htmlFor="git-status-filter">Show</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) =>
                  setFilter(v as GitStatusBucket | "all")
                }
              >
                <SelectTrigger id="git-status-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUCKET_OPTIONS.map((opt) => (
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
                  setInput(SAMPLE_GIT_STATUS_PORCELAIN)
                  toast.message("Loaded porcelain sample.")
                }}
              >
                Porcelain sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_STATUS_HUMAN)
                  toast.message("Loaded human-readable sample.")
                }}
              >
                Human sample
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
                    formatGitStatusPaths(result, filter),
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
                Copy paths
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied git add commands.",
                    formatGitAddCommands(result, filter),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy git add
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatGitStatusMarkdown(result),
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
          <StatRow label="Total files" value={result.summary.total} />
          <StatRow label="Staged" value={result.summary.staged} />
          <StatRow label="Unstaged" value={result.summary.unstaged} />
          <StatRow label="Untracked" value={result.summary.untracked} />
          <StatRow label="Conflicted" value={result.summary.conflicted} />
          <StatRow label="Ignored" value={result.summary.ignored} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "All parsed rows — a file can appear in multiple buckets."
              : `Showing ${filter} files only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No files in this bucket. Paste status output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>XY</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry, index) => (
                    <EntryRow
                      key={`${entry.path}-${entry.sourceLine}-${index}`}
                      entry={entry}
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
        <code className="rounded bg-muted px-1">git status --porcelain</code>{" "}
        before a commit or PR, paste here, then copy paths into agent context.
      </p>
    </div>
  )
}
