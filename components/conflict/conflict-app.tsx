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
import { Input } from "@/components/ui/input"
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
  SAMPLE_CONFLICT_FILEPATH,
  SAMPLE_CONFLICT_TEXT,
} from "@/lib/conflict/defaults"
import {
  conflictLocation,
  formatConflictCitations,
  formatConflictLineRanges,
  formatConflictMarkdown,
  formatResolvedContent,
  parseConflictMarkers,
} from "@/lib/conflict/parse"
import type { ConflictBlock } from "@/lib/conflict/types"
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

function ConflictRow({
  block,
  filepath,
  onCopy,
}: {
  block: ConflictBlock
  filepath: string
  onCopy: (text: string) => void
}) {
  const loc = conflictLocation(block, filepath || undefined)
  const ours = block.oursLabel || "ours"
  const theirs = block.theirsLabel || "theirs"

  return (
    <TableRow>
      <TableCell className="font-mono text-xs tabular-nums">
        {block.index}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {block.startLine}–{block.endLine}
      </TableCell>
      <TableCell className="text-sm">
        <Badge variant="outline" className="mr-1">
          {ours}
        </Badge>
        <span className="text-muted-foreground">vs</span>{" "}
        <Badge variant="secondary">{theirs}</Badge>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {block.oursLineCount} / {block.theirsLineCount}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(loc)}
            aria-label={`Copy citation ${loc}`}
            title="Copy citation"
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() =>
              onCopy(formatResolvedContent(block, "ours"))
            }
            title={`Copy ${ours} side`}
          >
            {ours}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() =>
              onCopy(formatResolvedContent(block, "theirs"))
            }
            title={`Copy ${theirs} side`}
          >
            {theirs}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ConflictApp() {
  const [input, setInput] = React.useState(SAMPLE_CONFLICT_TEXT)
  const [filepath, setFilepath] = React.useState(SAMPLE_CONFLICT_FILEPATH)

  const result = React.useMemo(() => parseConflictMarkers(input), [input])

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
              Merge conflict lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste conflicted file content — list{" "}
              <code className="text-xs">start:end:filepath</code> citations,
              compare ours vs theirs, and copy a side for agent resolution.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge
            variant={
              result.summary.conflictCount > 0 ? "destructive" : "secondary"
            }
          >
            {result.summary.conflictCount} conflict
            {result.summary.conflictCount === 1 ? "" : "s"}
          </Badge>
          {result.summary.issueCount > 0 ? (
            <Badge variant="destructive">
              {result.summary.issueCount} marker issue
              {result.summary.issueCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conflicted file</CardTitle>
          <CardDescription>
            Standard git markers: <code>{"<<<<<<<"}</code>,{" "}
            <code>{"======="}</code>, <code>{">>>>>>>"}</code>. Optional filepath
            enables Cursor-style citations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="conflict-filepath">File path (optional)</FieldLabel>
            <FieldContent>
              <Input
                id="conflict-filepath"
                value={filepath}
                onChange={(e) => setFilepath(e.target.value)}
                className="font-mono text-sm"
                placeholder="src/lib/config.ts"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="conflict-input">File content</FieldLabel>
            <FieldContent>
              <Textarea
                id="conflict-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={16}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste a file with merge conflict markers"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_CONFLICT_TEXT)
                setFilepath(SAMPLE_CONFLICT_FILEPATH)
                toast.message("Loaded sample conflict.")
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
                  "Copied citations.",
                  formatConflictCitations(result, filepath),
                )
              }
              disabled={
                result.blocks.length === 0 || !filepath.trim()
              }
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
                  "Copied line ranges.",
                  formatConflictLineRanges(result),
                )
              }
              disabled={result.blocks.length === 0}
            >
              Copy ranges
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatConflictMarkdown(result, filepath),
                )
              }
              disabled={result.blocks.length === 0}
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
          <StatRow label="Conflict blocks" value={result.summary.conflictCount} />
          <StatRow
            label="Ours lines (total)"
            value={result.summary.totalOursLines}
          />
          <StatRow
            label="Theirs lines (total)"
            value={result.summary.totalTheirsLines}
          />
          <StatRow label="Marker issues" value={result.summary.issueCount} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocks</CardTitle>
          <CardDescription>
            Copy a citation, or grab one side to paste into agent context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.blocks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No conflicts yet. Paste file content or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Lines</TableHead>
                    <TableHead>Labels</TableHead>
                    <TableHead>Ours / theirs</TableHead>
                    <TableHead className="min-w-[12rem]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.blocks.map((block) => (
                    <ConflictRow
                      key={`${block.startLine}-${block.endLine}`}
                      block={block}
                      filepath={filepath}
                      onCopy={(text) => void copyText("Copied.", text)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {result.issues.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marker issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {result.issues.map((issue) => (
                <li key={`${issue.kind}-${issue.line}`}>
                  Line {issue.line}: {issue.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
        Tip: after a merge, paste each conflicted file here with its repo path,
        then copy citations into Cursor for targeted resolution.
      </p>
    </div>
  )
}
