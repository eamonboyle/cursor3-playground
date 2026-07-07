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
  SAMPLE_GIT_DESCRIBE_LONG,
  SAMPLE_GIT_DESCRIBE_SHORT,
} from "@/lib/describe/defaults"
import {
  checkoutHashCommand,
  checkoutTagCommand,
  describeLongCommand,
  filterDescribeEntries,
  formatCheckoutHashCommands,
  formatCheckoutTagCommands,
  formatDescribeLines,
  formatDescribeMarkdown,
  parseDescribeOutput,
} from "@/lib/describe/parse"
import type { DescribeEntry, DescribeFilter } from "@/lib/describe/types"
import { DESCRIBE_KINDS } from "@/lib/describe/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: DescribeFilter; label: string }[] = [
  { value: "all", label: "All lines" },
  ...DESCRIBE_KINDS.map((kind) => ({
    value: kind,
    label: kind,
  })),
]

function kindVariant(
  kind: DescribeEntry["kind"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (kind) {
    case "exact-tag":
      return "default"
    case "ahead-of-tag":
      return "secondary"
    case "hash-only":
      return "outline"
    case "unknown":
      return "destructive"
    default: {
      const _exhaustive: never = kind
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

function DescribeRow({
  entry,
  onCopy,
}: {
  entry: DescribeEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{entry.raw}</TableCell>
      <TableCell>
        <Badge variant={kindVariant(entry.kind)} className="font-mono text-[0.65rem]">
          {entry.kind}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">{entry.tag ?? "—"}</TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.commitsAhead ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs">{entry.hash ?? "—"}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(entry.raw)}
            aria-label={`Copy describe line ${entry.raw}`}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          {entry.tag ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onCopy(checkoutTagCommand(entry))}
              aria-label={`Copy checkout tag for ${entry.tag}`}
              title="Copy git checkout tags/…"
            >
              <span className="font-mono text-[0.6rem]">tag</span>
            </Button>
          ) : null}
          {entry.hash ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onCopy(checkoutHashCommand(entry))}
              aria-label={`Copy checkout hash ${entry.hash}`}
              title="Copy git checkout hash"
            >
              <span className="font-mono text-[0.6rem]">co</span>
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function DescribeApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_DESCRIBE_LONG)
  const [filter, setFilter] = React.useState<DescribeFilter>("all")

  const result = React.useMemo(() => parseDescribeOutput(input), [input])
  const visible = React.useMemo(
    () => filterDescribeEntries(result.entries, filter),
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
            icon={PackageIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git describe lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git describe --tags --long</code>{" "}
              output — split exact tags from{" "}
              <code className="text-xs">tag-N-gHASH</code> lines, spot commits
              since the last release, copy checkout and describe commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="outline">{result.summary.total} line(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe output</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git describe --tags --long --always</code>{" "}
            on HEAD or a branch before tagging a release or writing CI version
            strings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="describe-input">Git describe log</FieldLabel>
            <FieldContent>
              <Textarea
                id="describe-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git describe output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="describe-filter">Kind</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as DescribeFilter)}
              >
                <SelectTrigger id="describe-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_DESCRIBE_LONG)
                  toast.message("Loaded long describe sample.")
                }}
              >
                Long sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_DESCRIBE_SHORT)
                  toast.message("Loaded short describe sample.")
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
                    "Copied describe lines.",
                    formatDescribeLines(result, { filter }),
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
                Copy lines
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied describe command.",
                    describeLongCommand(),
                  )
                }
              >
                Copy describe cmd
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied checkout tag commands.",
                    formatCheckoutTagCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy checkout tag
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied checkout hash commands.",
                    formatCheckoutHashCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy checkout hash
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatDescribeMarkdown(result),
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
          <StatRow label="Total lines" value={result.summary.total} />
          <StatRow label="Exact tag" value={result.summary.exactTag} />
          <StatRow label="Ahead of tag" value={result.summary.aheadOfTag} />
          <StatRow label="Hash only (--always)" value={result.summary.hashOnly} />
          <StatRow label="Semver tags" value={result.summary.semver} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parsed lines</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Each line is classified as an exact tag, commits since a tag, or a bare hash."
              : `Showing ${filter} lines only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No describe rows in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Describe</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Ahead</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <DescribeRow
                      key={`${entry.raw}-${entry.sourceLine}`}
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
        <Link href="/tags" className="text-foreground underline">
          tags lab
        </Link>{" "}
        — run <code className="rounded bg-muted px-1">git tag -l -n</code> for
        annotated messages, then{" "}
        <code className="rounded bg-muted px-1">git describe --tags --long</code>{" "}
        to see how far HEAD is from the nearest release.
      </p>
    </div>
  )
}
