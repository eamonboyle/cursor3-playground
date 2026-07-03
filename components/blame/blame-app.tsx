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
  SAMPLE_BLAME_FILEPATH,
  SAMPLE_BLAME_OUTPUT,
} from "@/lib/blame/defaults"
import {
  blameCitation,
  formatBlameAuthors,
  formatBlameCitations,
  formatBlameHashes,
  formatBlameMarkdown,
  parseBlameOutput,
} from "@/lib/blame/parse"
import type { BlameAuthorGroup } from "@/lib/blame/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  UserAccountIcon,
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

function AuthorGroupRow({
  group,
  filepath,
  onCopy,
}: {
  group: BlameAuthorGroup
  filepath?: string
  onCopy: (text: string) => void
}) {
  const rangeText = group.ranges
    .map((r) => (r.start === r.end ? `${r.start}` : `${r.start}–${r.end}`))
    .join(", ")

  return (
    <TableRow>
      <TableCell className="max-w-[10rem] truncate text-sm" title={group.author}>
        {group.author}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {group.lineCount}
      </TableCell>
      <TableCell className="font-mono text-xs">{group.hashes.join(", ")}</TableCell>
      <TableCell className="font-mono text-xs tabular-nums">{rangeText}</TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (!filepath || group.ranges.length === 0) {
              return
            }
            const first = group.ranges[0]
            if (!first) {
              return
            }
            onCopy(blameCitation(filepath, first.start, first.end))
          }}
          aria-label={`Copy citation for ${group.author}`}
          disabled={!filepath || group.ranges.length === 0}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function BlameApp() {
  const [input, setInput] = React.useState(SAMPLE_BLAME_OUTPUT)
  const [filepath, setFilepath] = React.useState(SAMPLE_BLAME_FILEPATH)
  const [authorFilter, setAuthorFilter] = React.useState("")

  const result = React.useMemo(
    () =>
      parseBlameOutput(input, {
        filepath,
        authorFilter,
      }),
    [input, filepath, authorFilter],
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

  const topAuthors = result.groups.slice(0, 6)

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={UserAccountIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git blame lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste git blame output to group lines by author, list commit
              ranges, and copy Cursor citation fences for a file.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blame input</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git blame -l path/to/file.ts</code> or{" "}
            <code className="text-xs">git blame --porcelain path/to/file.ts</code>{" "}
            and paste the output for a single file.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="blame-input">git blame output</FieldLabel>
            <FieldContent>
              <Textarea
                id="blame-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="blame-filepath">File path (for citations)</FieldLabel>
              <FieldContent>
                <Input
                  id="blame-filepath"
                  placeholder="lib/foo.ts"
                  value={filepath}
                  onChange={(e) => setFilepath(e.target.value)}
                  className="font-mono text-sm"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="blame-author">Author filter</FieldLabel>
              <FieldContent>
                <Input
                  id="blame-author"
                  placeholder="substring match"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="text-sm"
                />
              </FieldContent>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_BLAME_OUTPUT)
                setFilepath(SAMPLE_BLAME_FILEPATH)
                setAuthorFilter("")
              }}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="mr-1.5 size-3.5"
              />
              Reset sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                copyText("Copied markdown summary.", formatBlameMarkdown(result))
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="mr-1.5 size-3.5"
              />
              Copy summary
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                copyText(
                  "Copied citation fences.",
                  formatBlameCitations(result),
                )
              }
              disabled={!result.filepath}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="mr-1.5 size-3.5"
              />
              Copy citations
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                copyText("Copied author counts.", formatBlameAuthors(result))
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="mr-1.5 size-3.5"
              />
              Copy authors
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                copyText("Copied short hashes.", formatBlameHashes(result))
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="mr-1.5 size-3.5"
              />
              Copy hashes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>
            Line ownership from blame metadata — boundary lines (^) mark file
            origins or uncommitted edits.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <StatRow label="Lines parsed" value={result.summary.totalLines} />
            <StatRow label="Authors" value={result.summary.authorCount} />
            <StatRow label="Unique commits" value={result.summary.uniqueCommits} />
            <StatRow
              label="File"
              value={result.filepath ? result.filepath : "—"}
            />
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              <ul className="list-inside list-disc space-y-1">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {topAuthors.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {topAuthors.map((group) => (
                  <Badge key={group.author} variant="secondary">
                    {group.author}: {group.lineCount}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {result.groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By author</CardTitle>
            <CardDescription>
              Consecutive line ranges per author and commit hash — copy a
              citation fence for the first range in each row.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-16">Lines</TableHead>
                  <TableHead>Commits</TableHead>
                  <TableHead>Ranges</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.groups.map((group) => (
                  <AuthorGroupRow
                    key={group.author}
                    group={group}
                    filepath={result.filepath}
                    onCopy={(text) => copyText("Copied citation.", text)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {result.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line detail</CardTitle>
            <CardDescription>
              Parsed blame rows with hash, author, and source line number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Line</TableHead>
                  <TableHead className="w-20">Hash</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead>Content</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.lines.map((entry) => (
                  <TableRow key={`${entry.line}-${entry.sourceLine}`}>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {entry.isBoundary && (
                        <span className="text-muted-foreground">^</span>
                      )}
                      {entry.line}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.shortHash}
                    </TableCell>
                    <TableCell className="max-w-[8rem] truncate text-xs">
                      {entry.author}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {entry.date || "—"}
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate font-mono text-[0.7rem]">
                      {entry.content || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
