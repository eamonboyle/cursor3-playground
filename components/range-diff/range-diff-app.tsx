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
  SAMPLE_GIT_RANGE_DIFF,
  SAMPLE_GIT_RANGE_DIFF_SHORT,
} from "@/lib/range-diff/defaults"
import {
  filterRangeDiffEntries,
  formatRangeDiffMarkdown,
  formatRangeDiffNewHashes,
  formatRangeDiffShowCommands,
  formatRangeDiffSubjects,
  parseRangeDiffOutput,
  rangeDiffCommand,
  rangeDiffReflogCommand,
  showCommitCommand,
} from "@/lib/range-diff/parse"
import type { RangeDiffEntry, RangeDiffFilter } from "@/lib/range-diff/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitCompareIcon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: RangeDiffFilter; label: string }[] = [
  { value: "all", label: "All pairs" },
  { value: "equal", label: "Equal (=)" },
  { value: "modified", label: "Modified (!)" },
  { value: "added", label: "Added (>)" },
  { value: "removed", label: "Removed (<)" },
]

function comparisonVariant(
  comparison: RangeDiffEntry["comparison"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (comparison) {
    case "equal":
      return "secondary"
    case "modified":
      return "default"
    case "added":
      return "outline"
    case "removed":
      return "destructive"
    default: {
      const _exhaustive: never = comparison
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

function RangeDiffRow({
  entry,
  onCopy,
}: {
  entry: RangeDiffEntry
  onCopy: (text: string) => void
}) {
  const hashToCopy = entry.right.hash ?? entry.left.hash

  return (
    <TableRow>
      <TableCell>
        <Badge
          variant={comparisonVariant(entry.comparison)}
          className="font-mono text-xs"
        >
          {entry.comparisonSymbol}
          {entry.hasPatch ? " Δ" : ""}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.left.shortHash ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.right.shortHash ?? "—"}
      </TableCell>
      <TableCell className="max-w-[16rem] truncate text-xs" title={entry.subject}>
        {entry.subject || "—"}
      </TableCell>
      <TableCell>
        {hashToCopy ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(showCommitCommand(hashToCopy))}
            aria-label={`Copy show for ${entry.left.shortHash ?? entry.right.shortHash}`}
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

export function RangeDiffApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_RANGE_DIFF)
  const [filter, setFilter] = React.useState<RangeDiffFilter>("all")

  const result = React.useMemo(() => parseRangeDiffOutput(input), [input])
  const visible = React.useMemo(
    () => filterRangeDiffEntries(result.entries, filter),
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
            icon={GitCompareIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git range-diff lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git range-diff</code> output —
              compare rebased commit ranges, spot added/removed/modified commits,
              copy show commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">{result.summary.equal} equal</Badge>
          <Badge variant="outline">{result.summary.modified} modified</Badge>
          <Badge variant="outline">{result.summary.added} added</Badge>
          <Badge variant="outline">{result.summary.removed} removed</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Range-diff output</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git range-diff @{`{u}`} @{`{1}`} @</code>{" "}
            after a rebase to verify commits were preserved or intentionally
            changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="range-diff-input">Git range-diff log</FieldLabel>
            <FieldContent>
              <Textarea
                id="range-diff-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git range-diff output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="range-diff-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as RangeDiffFilter)}
              >
                <SelectTrigger id="range-diff-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_RANGE_DIFF)
                  toast.message("Loaded full range-diff sample.")
                }}
              >
                Full sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_RANGE_DIFF_SHORT)
                  toast.message("Loaded short range-diff sample.")
                }}
              >
                Short sample
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
                    "Copied new-side hashes.",
                    formatRangeDiffNewHashes(result, { filter }),
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
                Copy new hashes
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied subjects.",
                    formatRangeDiffSubjects(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy subjects
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied show commands.",
                    formatRangeDiffShowCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy show cmds
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText("Copied range-diff command.", rangeDiffReflogCommand())
                }
              >
                Copy range-diff cmd
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatRangeDiffMarkdown(result),
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
          <StatRow label="Total pairs" value={result.summary.total} />
          <StatRow label="Equal (=)" value={result.summary.equal} />
          <StatRow label="Modified (!)" value={result.summary.modified} />
          <StatRow label="Added (>)" value={result.summary.added} />
          <StatRow label="Removed (<)" value={result.summary.removed} />
          <StatRow label="With patch body" value={result.summary.withPatch} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commit pairs</CardTitle>
          <CardDescription>
            = unchanged, ! patch or message changed, &gt; added on right, &lt;
            removed from left.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No range-diff rows in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cmp</TableHead>
                    <TableHead>Left</TableHead>
                    <TableHead>Right</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <RangeDiffRow
                      key={`${entry.sourceLine}-${entry.raw}`}
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
            <code className="font-mono text-xs">{rangeDiffReflogCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", rangeDiffReflogCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{rangeDiffCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", rangeDiffCommand())}
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
        <Link href="/reflog" className="text-foreground underline">
          reflog lab
        </Link>{" "}
        to find pre-rebase refs, or the{" "}
        <Link href="/cherry" className="text-foreground underline">
          cherry lab
        </Link>{" "}
        to list commits unique to your branch vs upstream.
      </p>
    </div>
  )
}
