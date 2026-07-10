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
  SAMPLE_GIT_WORKTREE_LIST,
  SAMPLE_GIT_WORKTREE_PORCELAIN,
} from "@/lib/worktree/defaults"
import {
  filterWorktreeEntries,
  formatWorktreeBranches,
  formatWorktreeMarkdown,
  formatWorktreePaths,
  formatWorktreePruneCommands,
  formatWorktreeRemoveCommands,
  formatWorktreeUnlockCommands,
  parseWorktreeOutput,
  worktreeAddCommand,
  worktreeListCommand,
  worktreeListPorcelainCommand,
  worktreeRemoveCommand,
} from "@/lib/worktree/parse"
import type { WorktreeEntry, WorktreeFilter } from "@/lib/worktree/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: WorktreeFilter; label: string }[] = [
  { value: "all", label: "All worktrees" },
  { value: "normal", label: "Linked branches" },
  { value: "detached", label: "Detached HEAD" },
  { value: "locked", label: "Locked" },
  { value: "prunable", label: "Prunable" },
  { value: "bare", label: "Bare" },
]

function stateVariant(
  state: WorktreeEntry["state"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (state) {
    case "normal":
      return "default"
    case "detached":
      return "secondary"
    case "locked":
      return "destructive"
    case "prunable":
      return "outline"
    case "bare":
      return "outline"
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
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

function WorktreeRow({
  entry,
  onCopy,
}: {
  entry: WorktreeEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs" title={entry.path}>
        {entry.path}
        {entry.isMain ? (
          <Badge variant="secondary" className="ml-2 text-[0.65rem]">
            main
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="font-mono text-xs">{entry.branch ?? "—"}</TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.shortHash ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant={stateVariant(entry.state)}>{entry.state}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(entry.path)}
            aria-label={`Copy path ${entry.path}`}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          {!entry.isMain && entry.state !== "bare" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onCopy(worktreeRemoveCommand(entry.path))}
              aria-label={`Copy remove command for ${entry.path}`}
            >
              rm
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function WorktreeApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_WORKTREE_LIST)
  const [filter, setFilter] = React.useState<WorktreeFilter>("all")

  const result = React.useMemo(() => parseWorktreeOutput(input), [input])
  const visible = React.useMemo(
    () => filterWorktreeEntries(result.entries, filter),
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
            icon={Folder01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git worktree lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git worktree list</code> output —
              inspect linked checkouts, detect locked or prunable trees, copy
              remove and prune commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.total} worktree
            {result.summary.total === 1 ? "" : "s"}
          </Badge>
          {result.summary.prunable > 0 ? (
            <Badge variant="destructive">
              {result.summary.prunable} prunable
            </Badge>
          ) : null}
          {result.summary.locked > 0 ? (
            <Badge variant="outline">
              {result.summary.locked} locked
            </Badge>
          ) : null}
          {result.format !== "unknown" ? (
            <Badge variant="outline">{result.format}</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Worktree output</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git worktree list</code> when juggling
            parallel branches or cloud-agent checkouts in separate folders.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="worktree-input">Git worktree log</FieldLabel>
            <FieldContent>
              <Textarea
                id="worktree-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git worktree list output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="worktree-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as WorktreeFilter)}
              >
                <SelectTrigger id="worktree-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_WORKTREE_LIST)
                  toast.message("Loaded list sample.")
                }}
              >
                List sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_WORKTREE_PORCELAIN)
                  toast.message("Loaded porcelain sample.")
                }}
              >
                Porcelain sample
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
                    "Copied paths.",
                    formatWorktreePaths(result, { filter }),
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
                    "Copied branches.",
                    formatWorktreeBranches(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy branches
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied remove commands.",
                    formatWorktreeRemoveCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy remove
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied prune commands.",
                    formatWorktreePruneCommands(result),
                  )
                }
              >
                Copy prune
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied unlock commands.",
                    formatWorktreeUnlockCommands(result),
                  )
                }
                disabled={result.summary.locked === 0}
              >
                Copy unlock
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatWorktreeMarkdown(result),
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
          <StatRow label="Linked branches" value={result.summary.normal} />
          <StatRow label="Detached" value={result.summary.detached} />
          <StatRow label="Locked" value={result.summary.locked} />
          <StatRow label="Prunable" value={result.summary.prunable} />
          <StatRow label="Bare" value={result.summary.bare} />
          <StatRow
            label="Main path"
            value={result.summary.mainPath ?? "—"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Worktrees</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "All linked checkouts from the pasted output."
              : `Showing ${filter.replace("-", " ")} only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No worktree rows in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>HEAD</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <WorktreeRow
                      key={`${entry.path}-${entry.sourceLine}`}
                      entry={entry}
                      onCopy={(text) => void copyText("Copied.", text)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Useful commands</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{worktreeListCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", worktreeListCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">
              {worktreeListPorcelainCommand()}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                void copyText("Copied.", worktreeListPorcelainCommand())
              }
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">
              {worktreeAddCommand("../feature-wt", "feature/x")}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied.",
                  worktreeAddCommand("../feature-wt", "feature/x"),
                )
              }
            >
              Copy
            </Button>
          </div>
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
        Tip: pair with the{" "}
        <Link href="/branches" className="text-foreground underline">
          branches lab
        </Link>{" "}
        to pick a branch before{" "}
        <code className="rounded bg-muted px-1">
          git worktree add ../wt feature/x
        </code>
        , or the{" "}
        <Link href="/reflog" className="text-foreground underline">
          reflog lab
        </Link>{" "}
        to recover after removing the wrong checkout.
      </p>
    </div>
  )
}
