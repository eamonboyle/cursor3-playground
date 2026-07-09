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
  SAMPLE_GIT_SHORTLOG_EMAIL,
  SAMPLE_GIT_SHORTLOG_NUMBERED,
} from "@/lib/shortlog/defaults"
import {
  filterShortlogEntries,
  formatShortlogAtMentions,
  formatShortlogAuthors,
  formatShortlogMarkdown,
  formatShortlogReleaseNotes,
  parseShortlogOutput,
  shortlogEmailCommand,
  shortlogNumberedCommand,
  shortlogSinceTagCommand,
} from "@/lib/shortlog/parse"
import type { ShortlogEntry, ShortlogFilter } from "@/lib/shortlog/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: ShortlogFilter; label: string }[] = [
  { value: "all", label: "All authors" },
  { value: "with-email", label: "With email" },
  { value: "without-email", label: "Name only" },
]

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

function AuthorRow({
  entry,
  onCopy,
}: {
  entry: ShortlogEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs tabular-nums">{entry.count}</TableCell>
      <TableCell className="font-mono text-xs">{entry.name}</TableCell>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs" title={entry.email}>
        {entry.email ?? "—"}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(entry.name)}
          aria-label={`Copy author ${entry.name}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function ShortlogApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_SHORTLOG_NUMBERED)
  const [filter, setFilter] = React.useState<ShortlogFilter>("all")

  const result = React.useMemo(() => parseShortlogOutput(input), [input])
  const visible = React.useMemo(
    () => filterShortlogEntries(result.entries, filter),
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
            icon={UserGroupIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git shortlog lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git shortlog -sn</code> or{" "}
              <code className="text-xs">-sne</code> output — rank contributors by
              commit count, copy release notes and @mentions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.authors} author
            {result.summary.authors === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">
            {result.summary.totalCommits} commit
            {result.summary.totalCommits === 1 ? "" : "s"}
          </Badge>
          {result.format !== "unknown" ? (
            <Badge variant="outline">{result.format}</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shortlog output</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git shortlog -sn main..HEAD</code> before
            a release to see who contributed since the last tag.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="shortlog-input">Git shortlog log</FieldLabel>
            <FieldContent>
              <Textarea
                id="shortlog-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git shortlog -sn output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="shortlog-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as ShortlogFilter)}
              >
                <SelectTrigger id="shortlog-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_SHORTLOG_NUMBERED)
                  toast.message("Loaded numbered shortlog sample.")
                }}
              >
                Numbered sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_SHORTLOG_EMAIL)
                  toast.message("Loaded email shortlog sample.")
                }}
              >
                Email sample
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
                    "Copied author names.",
                    formatShortlogAuthors(result, { filter }),
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
                    "Copied release notes.",
                    formatShortlogReleaseNotes(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy release notes
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied @mentions.",
                    formatShortlogAtMentions(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy @mentions
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied shortlog command.",
                    shortlogNumberedCommand(),
                  )
                }
              >
                Copy shortlog cmd
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatShortlogMarkdown(result),
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
          <StatRow label="Authors" value={result.summary.authors} />
          <StatRow label="Total commits" value={result.summary.totalCommits} />
          <StatRow label="With email" value={result.summary.withEmail} />
          <StatRow
            label="Top contributor"
            value={
              result.summary.topAuthor
                ? `${result.summary.topAuthor} (${result.summary.topCount})`
                : "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contributors</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Sorted by commit count descending."
              : `Showing ${filter.replace("-", " ")} only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No author rows in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commits</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <AuthorRow
                      key={`${entry.name}-${entry.sourceLine}`}
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
            <code className="font-mono text-xs">{shortlogNumberedCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                void copyText("Copied.", shortlogNumberedCommand())
              }
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{shortlogEmailCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", shortlogEmailCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{shortlogSinceTagCommand("v1.0.0")}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                void copyText("Copied.", shortlogSinceTagCommand("v1.0.0"))
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
        <Link href="/git-log" className="text-foreground underline">
          git log lab
        </Link>{" "}
        for conventional commit summaries, or the{" "}
        <Link href="/tags" className="text-foreground underline">
          tags lab
        </Link>{" "}
        to pick a release range like{" "}
        <code className="rounded bg-muted px-1">
          git shortlog -sn v1.0.0..HEAD
        </code>
        .
      </p>
    </div>
  )
}
