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
  SAMPLE_GIT_TAG_ANNOTATED,
  SAMPLE_GIT_TAG_FORMAT,
  SAMPLE_GIT_TAG_PLAIN,
} from "@/lib/tags/defaults"
import {
  filterTagEntries,
  formatTagCheckoutCommands,
  formatTagDeleteCommands,
  formatTagMarkdown,
  formatTagNames,
  formatTagPushCommands,
  formatTagShowCommands,
  parseTagOutput,
  tagCheckoutCommand,
  tagShowCommand,
} from "@/lib/tags/parse"
import type { TagEntry, TagFilter } from "@/lib/tags/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: TagFilter; label: string }[] = [
  { value: "all", label: "All tags" },
  { value: "annotated", label: "Annotated" },
  { value: "lightweight", label: "Lightweight" },
  { value: "semver", label: "Semver (v*.*.*)" },
]

function kindVariant(
  kind: TagEntry["kind"],
): "default" | "secondary" | "outline" {
  return kind === "annotated" ? "default" : "outline"
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

function TagRow({
  entry,
  onCopy,
}: {
  entry: TagEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{entry.name}</TableCell>
      <TableCell>
        <Badge variant={kindVariant(entry.kind)} className="font-mono text-[0.65rem]">
          {entry.kind}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.hash ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.date ?? "—"}
      </TableCell>
      <TableCell className="max-w-[14rem] truncate text-xs" title={entry.message}>
        {entry.message ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(entry.name)}
            aria-label={`Copy tag ${entry.name}`}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(tagCheckoutCommand(entry))}
            aria-label={`Copy checkout for ${entry.name}`}
          >
            <span className="font-mono text-[0.6rem]">co</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(tagShowCommand(entry))}
            aria-label={`Copy show for ${entry.name}`}
          >
            <span className="font-mono text-[0.6rem]">sh</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function TagsApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_TAG_ANNOTATED)
  const [filter, setFilter] = React.useState<TagFilter>("all")

  const result = React.useMemo(() => parseTagOutput(input), [input])
  const visible = React.useMemo(
    () => filterTagEntries(result.entries, filter),
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
            icon={Tag01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Git tags lab</h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git tag</code>,{" "}
              <code className="text-xs">git tag -l -n</code>, or custom{" "}
              <code className="text-xs">--format</code> output — list releases,
              filter semver tags, copy checkout, push, and delete commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="outline">{result.summary.total} tag(s)</Badge>
          <Badge variant="outline">{result.format} format</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tag output</CardTitle>
          <CardDescription>
            Run <code className="text-xs">git tag -l -n</code> for annotated
            messages, or{" "}
            <code className="text-xs">
              git tag --sort=-creatordate --format=&apos;%(refname:short)
              %(objectname:short) %(creatordate:short) %(subject)&apos;
            </code>{" "}
            for hash and date columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="tags-input">Git tag list</FieldLabel>
            <FieldContent>
              <Textarea
                id="tags-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git tag output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="tags-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as TagFilter)}
              >
                <SelectTrigger id="tags-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_TAG_ANNOTATED)
                  toast.message("Loaded annotated sample.")
                }}
              >
                Sample -n
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_TAG_PLAIN)
                  toast.message("Loaded plain sample.")
                }}
              >
                Sample plain
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_TAG_FORMAT)
                  toast.message("Loaded format sample.")
                }}
              >
                Sample format
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
                  void copyText("Copied tag names.", formatTagNames(result, { filter }))
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
                    formatTagCheckoutCommands(result, { filter }),
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
                    "Copied push commands.",
                    formatTagPushCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy push
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied delete commands.",
                    formatTagDeleteCommands(result, { filter }),
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
                  void copyText(
                    "Copied show commands.",
                    formatTagShowCommands(result, { filter }),
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
                  void copyText("Copied markdown report.", formatTagMarkdown(result))
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
          <StatRow label="Total tags" value={result.summary.total} />
          <StatRow label="Annotated" value={result.summary.annotated} />
          <StatRow label="Lightweight" value={result.summary.lightweight} />
          <StatRow label="Semver" value={result.summary.semver} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "All parsed tags — newest format lines appear in paste order."
              : `Showing ${filter} tags only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tags in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <TagRow
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
        <Link href="/semver" className="text-foreground underline underline-offset-2">
          semver lab
        </Link>{" "}
        to compare release versions, or use{" "}
        <code className="rounded bg-muted px-1">git describe --tags</code> to find
        the nearest tag from a commit.
      </p>
    </div>
  )
}
