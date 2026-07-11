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
  SAMPLE_GIT_LS_REMOTE,
  SAMPLE_GIT_LS_REMOTE_HEADS,
} from "@/lib/ls-remote/defaults"
import {
  filterLsRemoteEntries,
  formatLsRemoteBranchNames,
  formatLsRemoteCheckoutCommands,
  formatLsRemoteFetchCommands,
  formatLsRemoteMarkdown,
  formatLsRemoteTagNames,
  lsRemoteCommand,
  lsRemoteHeadsCommand,
  lsRemoteTagsCommand,
  parseLsRemoteOutput,
} from "@/lib/ls-remote/parse"
import type { LsRemoteEntry, LsRemoteFilter } from "@/lib/ls-remote/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CloudServerIcon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: LsRemoteFilter; label: string }[] = [
  { value: "all", label: "All refs" },
  { value: "branches", label: "Branches" },
  { value: "tags", label: "Tags" },
  { value: "head", label: "HEAD" },
  { value: "other", label: "Other (pull, etc.)" },
]

function kindVariant(
  kind: LsRemoteEntry["kind"],
  isAnnotated?: boolean,
): "default" | "secondary" | "outline" | "destructive" {
  switch (kind) {
    case "head":
      return "default"
    case "branch":
      return "secondary"
    case "tag":
      return isAnnotated ? "default" : "outline"
    case "tag-peeled":
      return "outline"
    case "other":
      return "destructive"
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function kindLabel(entry: LsRemoteEntry): string {
  if (entry.kind === "tag" && entry.isAnnotatedTag) {
    return "tag (annotated)"
  }
  return entry.kind
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

function RefRow({
  entry,
  onCopy,
}: {
  entry: LsRemoteEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="max-w-[12rem] truncate font-mono text-xs" title={entry.name}>
        {entry.name}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">{entry.shortHash}</TableCell>
      <TableCell>
        <Badge
          variant={kindVariant(entry.kind, entry.isAnnotatedTag)}
          className="font-mono text-[0.65rem]"
        >
          {kindLabel(entry)}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs" title={entry.ref}>
        {entry.ref}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(entry.name)}
          aria-label={`Copy ref ${entry.name}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function LsRemoteApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_LS_REMOTE)
  const [filter, setFilter] = React.useState<LsRemoteFilter>("all")

  const result = React.useMemo(() => parseLsRemoteOutput(input), [input])
  const visible = React.useMemo(
    () => filterLsRemoteEntries(result.entries, filter),
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
            icon={CloudServerIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git ls-remote lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git ls-remote</code> output — list
              remote branches and tags, resolve HEAD, copy fetch and checkout
              commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.total} ref{result.summary.total === 1 ? "" : "s"}
          </Badge>
          {result.summary.defaultBranch ? (
            <Badge variant="outline">default: {result.summary.defaultBranch}</Badge>
          ) : null}
          {result.summary.semverTags > 0 ? (
            <Badge variant="outline">
              {result.summary.semverTags} semver tag
              {result.summary.semverTags === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ls-remote output</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git ls-remote origin</code> before pushing
            or fetching to see what exists on the remote.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="ls-remote-input">Git ls-remote log</FieldLabel>
            <FieldContent>
              <Textarea
                id="ls-remote-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git ls-remote origin output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="ls-remote-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as LsRemoteFilter)}
              >
                <SelectTrigger id="ls-remote-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_LS_REMOTE)
                  toast.message("Loaded full ls-remote sample.")
                }}
              >
                Full sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_LS_REMOTE_HEADS)
                  toast.message("Loaded heads-only sample.")
                }}
              >
                Heads sample
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
                    formatLsRemoteBranchNames(result),
                  )
                }
                disabled={result.summary.branches === 0}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy branches
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText("Copied tag names.", formatLsRemoteTagNames(result))
                }
                disabled={result.summary.tags === 0}
              >
                Copy tags
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied fetch commands.",
                    formatLsRemoteFetchCommands(result),
                  )
                }
                disabled={result.summary.branches === 0}
              >
                Copy fetch cmds
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied checkout commands.",
                    formatLsRemoteCheckoutCommands(result),
                  )
                }
                disabled={result.summary.branches === 0}
              >
                Copy checkout cmds
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText("Copied ls-remote command.", lsRemoteCommand())
                }
              >
                Copy ls-remote cmd
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatLsRemoteMarkdown(result),
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
          <StatRow label="Total refs" value={result.summary.total} />
          <StatRow label="Branches" value={result.summary.branches} />
          <StatRow label="Tags" value={result.summary.tags} />
          <StatRow label="Annotated tags" value={result.summary.peeled} />
          <StatRow label="Semver tags" value={result.summary.semverTags} />
          <StatRow
            label="HEAD"
            value={
              result.summary.headHash
                ? `${result.summary.headHash.slice(0, 7)}${
                    result.summary.defaultBranch
                      ? ` → ${result.summary.defaultBranch}`
                      : ""
                  }`
                : "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Remote refs</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "All hash and ref pairs from the pasted output."
              : `Showing ${filter.replace("-", " ")} only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No refs in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <RefRow
                      key={`${entry.ref}-${entry.sourceLine}`}
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
            <code className="font-mono text-xs">{lsRemoteCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", lsRemoteCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{lsRemoteHeadsCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", lsRemoteHeadsCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{lsRemoteTagsCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", lsRemoteTagsCommand())}
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
        <Link href="/remote" className="text-foreground underline">
          remote lab
        </Link>{" "}
        to inspect configured fetch/push URLs, or the{" "}
        <Link href="/tags" className="text-foreground underline">
          tags lab
        </Link>{" "}
        to compare local tags with remote{" "}
        <code className="rounded bg-muted px-1">git ls-remote --tags origin</code>
        .
      </p>
    </div>
  )
}
