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
import { Switch } from "@/components/ui/switch"
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
  SAMPLE_GIT_LOG_FULL,
  SAMPLE_GIT_LOG_ONELINE,
} from "@/lib/git-log/defaults"
import {
  formatGitLogHashes,
  formatGitLogMarkdown,
  formatGitLogReleaseNotes,
  formatGitLogSubjects,
  parseGitLogOutput,
} from "@/lib/git-log/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitBranchIcon,
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

function typeBadgeVariant(
  type: string | undefined,
  isMerge: boolean,
): "default" | "secondary" | "outline" | "destructive" {
  if (isMerge) {
    return "outline"
  }
  if (type === "feat") {
    return "default"
  }
  if (type === "fix") {
    return "destructive"
  }
  return "secondary"
}

export function GitLogApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_LOG_ONELINE)
  const [hideMerges, setHideMerges] = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState("")

  const result = React.useMemo(
    () =>
      parseGitLogOutput(input, {
        hideMerges,
        typeFilter,
      }),
    [input, hideMerges, typeFilter],
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

  const typeRows = Object.entries(result.summary.byType).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={GitBranchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git log lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git log --oneline</code> or full
              log output — group conventional commits, detect breaking changes,
              and copy PR or release notes.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.commitCount} commit
            {result.summary.commitCount === 1 ? "" : "s"}
          </Badge>
          {result.summary.breakingCount > 0 ? (
            <Badge variant="destructive">
              {result.summary.breakingCount} breaking
            </Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Git log output</CardTitle>
          <CardDescription>
            Supports <code className="text-xs">git log --oneline</code>, decorated
            oneline lines, or full blocks with{" "}
            <code className="text-xs">commit &lt;hash&gt;</code> headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="git-log-output">Terminal log</FieldLabel>
            <FieldContent>
              <Textarea
                id="git-log-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git log output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="git-log-hide-merges"
                checked={hideMerges}
                onCheckedChange={setHideMerges}
              />
              <FieldLabel
                htmlFor="git-log-hide-merges"
                className="mb-0 cursor-pointer"
              >
                Hide merge commits
              </FieldLabel>
            </div>
            <Field className="max-w-xs">
              <FieldLabel htmlFor="git-log-type-filter">
                Type filter
              </FieldLabel>
              <FieldContent>
                <Input
                  id="git-log-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  placeholder="feat, fix, breaking"
                  className="font-mono text-sm"
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
                setInput(SAMPLE_GIT_LOG_ONELINE)
                toast.message("Loaded oneline sample.")
              }}
            >
              Load oneline sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_GIT_LOG_FULL)
                toast.message("Loaded full log sample.")
              }}
            >
              Load full log sample
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
                  "Copied release notes.",
                  formatGitLogReleaseNotes(result),
                )
              }
              disabled={result.commits.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy release notes
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied subjects.",
                  formatGitLogSubjects(result),
                )
              }
              disabled={result.commits.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy subjects
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied short hashes.",
                  formatGitLogHashes(result),
                )
              }
              disabled={result.commits.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy hashes
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatGitLogMarkdown(result),
                )
              }
              disabled={result.commits.length === 0}
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
          <StatRow label="Commits" value={result.summary.commitCount} />
          <StatRow label="Merge commits" value={result.summary.mergeCount} />
          <StatRow
            label="Breaking changes"
            value={result.summary.breakingCount}
          />
          {typeRows.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {typeRows.map(([type, count]) => (
                <Badge key={type} variant="outline">
                  {type} × {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commits</CardTitle>
          <CardDescription>
            Parsed conventional commits — copy release notes or subjects for PR
            descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.commits.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No commits yet. Paste git log output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Hash</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.commits.map((entry) => (
                    <TableRow key={`${entry.hash}-${entry.sourceLine}`}>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {entry.shortHash}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeBadgeVariant(entry.type, entry.isMerge)}
                          className="font-mono text-[0.65rem]"
                        >
                          {entry.isMerge ? "merge" : (entry.type ?? "other")}
                          {entry.breaking ? "!" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm sm:max-w-md">
                        {entry.scope ? (
                          <span className="text-muted-foreground font-mono text-xs">
                            {entry.scope}:{" "}
                          </span>
                        ) : null}
                        {entry.subject}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            void copyText(
                              "Copied subject.",
                              entry.subject,
                            )
                          }
                          aria-label={`Copy ${entry.subject}`}
                        >
                          <HugeiconsIcon
                            icon={Copy01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
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
        Tip: run{" "}
        <code className="rounded bg-muted px-1">
          git log --oneline main..HEAD
        </code>
        , paste the output here, then copy release notes for your PR
        description.
      </p>
    </div>
  )
}
