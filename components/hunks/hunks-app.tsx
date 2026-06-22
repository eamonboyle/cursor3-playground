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
import { SAMPLE_HUNKS_DIFF } from "@/lib/hunks/defaults"
import {
  formatHunkCitation,
  formatHunkCitations,
  formatHunksMarkdown,
  parseDiffHunks,
} from "@/lib/hunks/parse"
import type { DiffHunk } from "@/lib/hunks/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitCompareIcon,
} from "@hugeicons/core-free-icons"

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

function HunkRow({
  hunk,
  onCopy,
}: {
  hunk: DiffHunk
  onCopy: (text: string) => void
}) {
  const citation = formatHunkCitation(hunk)
  return (
    <TableRow>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs">
        {hunk.path}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {hunk.hunkIndex}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
        +{hunk.additions}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums text-red-600 dark:text-red-400">
        -{hunk.deletions}
      </TableCell>
      <TableCell className="max-w-[12rem] truncate font-mono text-xs">
        {citation}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(citation)}
          aria-label={`Copy ${citation}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function HunksApp() {
  const [input, setInput] = React.useState(SAMPLE_HUNKS_DIFF)

  const result = React.useMemo(() => parseDiffHunks(input), [input])

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
              Diff hunk lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste a unified diff — list @@ hunks with line ranges and copy{" "}
              <code className="text-xs">start:end:filepath</code> citations for
              Cursor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.hunkCount} hunk
            {result.summary.hunkCount === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">{result.summary.fileCount} file(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unified diff</CardTitle>
          <CardDescription>
            Supports <code className="text-xs">git diff</code>,{" "}
            <code className="text-xs">git show</code>, and{" "}
            <code className="text-xs">.patch</code> files. Binary files are
            skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="hunks-input">Diff text</FieldLabel>
            <FieldContent>
              <Textarea
                id="hunks-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste unified diff output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_HUNKS_DIFF)
                toast.message("Loaded sample diff.")
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
                  "Copied citations (one per line).",
                  formatHunkCitations(result),
                )
              }
              disabled={result.hunks.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy citations
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatHunksMarkdown(result),
                )
              }
              disabled={result.hunks.length === 0}
            >
              Copy markdown
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow label="Hunks" value={result.summary.hunkCount} />
          <StatRow label="Files" value={result.summary.fileCount} />
          <StatRow
            label="Lines added"
            value={`+${result.summary.additions}`}
          />
          <StatRow
            label="Lines removed"
            value={`-${result.summary.deletions}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hunks</CardTitle>
          <CardDescription>
            Citation ranges use the new-file side when available; deleted files
            use the old side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.hunks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hunks yet. Paste a diff or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>#</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>+</TableHead>
                    <TableHead>−</TableHead>
                    <TableHead>Citation</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.hunks.map((hunk, index) => (
                    <HunkRow
                      key={`${hunk.path}-${hunk.hunkIndex}-${hunk.sourceLine}-${index}`}
                      hunk={hunk}
                      onCopy={(text) => void copyText("Copied citation.", text)}
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
        Tip: run <code className="rounded bg-muted px-1">git diff</code> or{" "}
        <code className="rounded bg-muted px-1">git show HEAD</code>, paste the
        output, then copy citations into agent context.
      </p>
    </div>
  )
}
