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
import { SAMPLE_GIT_STASH_LIST } from "@/lib/git-stash/defaults"
import {
  filterGitStashEntries,
  formatStashApplyCommands,
  formatStashMarkdown,
  formatStashPopCommands,
  formatStashRefs,
  formatStashShowCommands,
  parseGitStashList,
} from "@/lib/git-stash/parse"
import type { GitStashEntry, GitStashKind } from "@/lib/git-stash/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive02Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

const KIND_OPTIONS: { value: GitStashKind | "all"; label: string }[] = [
  { value: "all", label: "All stashes" },
  { value: "wip", label: "WIP on …" },
  { value: "on", label: "On …" },
  { value: "custom", label: "Custom label" },
]

function kindVariant(
  kind: GitStashKind,
): "default" | "secondary" | "destructive" | "outline" {
  if (kind === "wip") {
    return "default"
  }
  if (kind === "on") {
    return "secondary"
  }
  return "outline"
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
  entry: GitStashEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs tabular-nums">{entry.ref}</TableCell>
      <TableCell>
        <Badge variant={kindVariant(entry.kind)} className="font-mono text-[0.65rem]">
          {entry.kind}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs" title={entry.branch}>
        {entry.branch ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.commit ?? "—"}
      </TableCell>
      <TableCell className="max-w-[14rem] truncate text-xs" title={entry.message}>
        {entry.message}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(entry.ref)}
          aria-label={`Copy ${entry.ref}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function GitStashApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_STASH_LIST)
  const [filter, setFilter] = React.useState<GitStashKind | "all">("all")

  const result = React.useMemo(() => parseGitStashList(input), [input])
  const visible = React.useMemo(
    () => filterGitStashEntries(result.entries, filter),
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
            icon={Archive02Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Git stash lab</h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git stash list</code> — inspect saved
              worktrees, filter by kind, and copy{" "}
              <code className="text-xs">git stash show</code>,{" "}
              <code className="text-xs">apply</code>, or <code className="text-xs">pop</code>{" "}
              commands for agent context.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="outline">{result.summary.total} stash(es)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stash list</CardTitle>
          <CardDescription>
            Run <code className="text-xs">git stash list</code> before switching branches
            or handing off to an agent — paste the full output here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="git-stash-input">Git stash list</FieldLabel>
            <FieldContent>
              <Textarea
                id="git-stash-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git stash list output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-48">
              <FieldLabel htmlFor="git-stash-filter">Show</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as GitStashKind | "all")}
              >
                <SelectTrigger id="git-stash-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((opt) => (
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
                  setInput(SAMPLE_GIT_STASH_LIST)
                  toast.message("Loaded sample stash list.")
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
                  void copyText("Copied stash refs.", formatStashRefs(visible))
                }
                disabled={visible.length === 0}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy refs
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied git stash show commands.",
                    formatStashShowCommands(visible),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy show
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied git stash apply commands.",
                    formatStashApplyCommands(visible),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy apply
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied git stash pop commands.",
                    formatStashPopCommands(visible),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy pop
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatStashMarkdown({ ...result, entries: visible }),
                  )
                }
                disabled={visible.length === 0}
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
          <StatRow label="Total stashes" value={result.summary.total} />
          <StatRow label="WIP on …" value={result.summary.wip} />
          <StatRow label="On …" value={result.summary.on} />
          <StatRow label="Custom labels" value={result.summary.custom} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stashes</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Newest stash is stash@{0} — higher indexes are older."
              : `Showing ${filter} stashes only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No stashes in this filter. Paste stash list output or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Commit</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <EntryRow
                      key={entry.ref}
                      entry={entry}
                      onCopy={(text) => void copyText("Copied stash ref.", text)}
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
        Tip: run <code className="rounded bg-muted px-1">git stash list</code> before
        branch switches, paste here, then copy <code className="rounded bg-muted px-1">show</code>{" "}
        or <code className="rounded bg-muted px-1">apply</code> commands into agent context.
      </p>
    </div>
  )
}
