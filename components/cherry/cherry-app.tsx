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
  SAMPLE_GIT_CHERRY_PLAIN,
  SAMPLE_GIT_CHERRY_VERBOSE,
} from "@/lib/cherry/defaults"
import {
  cherryCommand,
  cherryPickRangeCommand,
  cherryVerboseCommand,
  filterCherryEntries,
  formatCherryHashes,
  formatCherryLogRange,
  formatCherryMarkdown,
  formatCherryRebaseHint,
  formatCherryShowCommands,
  formatCherrySubjects,
  parseCherryOutput,
  showCommitCommand,
} from "@/lib/cherry/parse"
import type { CherryEntry, CherryFilter } from "@/lib/cherry/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitCompareIcon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: CherryFilter; label: string }[] = [
  { value: "all", label: "All commits" },
  { value: "unique", label: "Unique (+)" },
  { value: "equivalent", label: "Equivalent (−)" },
]

function signVariant(
  sign: CherryEntry["sign"],
): "default" | "secondary" | "outline" {
  switch (sign) {
    case "unique":
      return "default"
    case "equivalent":
      return "secondary"
    default: {
      const _exhaustive: never = sign
      return _exhaustive
    }
  }
}

function signLabel(sign: CherryEntry["sign"]): string {
  return sign === "unique" ? "+" : "−"
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

function CherryRow({
  entry,
  onCopy,
}: {
  entry: CherryEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant={signVariant(entry.sign)} className="font-mono text-xs">
          {signLabel(entry.sign)}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {entry.shortHash}
      </TableCell>
      <TableCell className="max-w-[18rem] truncate text-xs" title={entry.subject}>
        {entry.subject ?? "—"}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(showCommitCommand(entry.hash))}
          aria-label={`Copy show for ${entry.shortHash}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function CherryApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_CHERRY_VERBOSE)
  const [filter, setFilter] = React.useState<CherryFilter>("all")

  const result = React.useMemo(() => parseCherryOutput(input), [input])
  const visible = React.useMemo(
    () => filterCherryEntries(result.entries, filter),
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
              Git cherry lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git cherry -v</code> output — list
              commits unique to your branch (+) vs patch-equivalent upstream (−),
              copy show and rebase commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.unique} unique
          </Badge>
          <Badge variant="outline">
            {result.summary.equivalent} equivalent
          </Badge>
          {result.format !== "unknown" ? (
            <Badge variant="outline">{result.format}</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cherry output</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git cherry -v origin/main</code> before
            opening a PR to see which commits are truly new vs already upstream.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="cherry-input">Git cherry log</FieldLabel>
            <FieldContent>
              <Textarea
                id="cherry-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git cherry -v origin/main output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="cherry-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as CherryFilter)}
              >
                <SelectTrigger id="cherry-filter" className="w-full">
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
                  setInput(SAMPLE_GIT_CHERRY_VERBOSE)
                  toast.message("Loaded verbose cherry sample.")
                }}
              >
                Verbose sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_CHERRY_PLAIN)
                  toast.message("Loaded plain cherry sample.")
                }}
              >
                Plain sample
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
                    "Copied unique hashes.",
                    formatCherryHashes(result, { filter: "unique" }),
                  )
                }
                disabled={result.summary.unique === 0}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy unique hashes
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied subjects.",
                    formatCherrySubjects(result, { filter }),
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
                    formatCherryShowCommands(result, { filter }),
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
                  void copyText("Copied cherry command.", cherryVerboseCommand())
                }
              >
                Copy cherry cmd
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatCherryMarkdown(result),
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
          <StatRow label="Total rows" value={result.summary.total} />
          <StatRow label="Unique (+)" value={result.summary.unique} />
          <StatRow label="Equivalent (−)" value={result.summary.equivalent} />
          <StatRow
            label="Has subjects"
            value={result.summary.hasSubjects ? "yes" : "no"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commits</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "+ means new to your branch; − means patch-equivalent upstream."
              : `Showing ${filter} commits only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No cherry rows in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sign</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <CherryRow
                      key={`${entry.hash}-${entry.sourceLine}`}
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
            <code className="font-mono text-xs">{cherryVerboseCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", cherryVerboseCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{cherryCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", cherryCommand())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{formatCherryLogRange()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", formatCherryLogRange())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{formatCherryRebaseHint()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", formatCherryRebaseHint())}
            >
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <code className="font-mono text-xs">{cherryPickRangeCommand()}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyText("Copied.", cherryPickRangeCommand())}
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
        <Link href="/branches" className="text-foreground underline">
          branches lab
        </Link>{" "}
        to confirm tracking, or the{" "}
        <Link href="/git-log" className="text-foreground underline">
          git log lab
        </Link>{" "}
        for conventional commit summaries on{" "}
        <code className="rounded bg-muted px-1">origin/main..HEAD</code>.
      </p>
    </div>
  )
}
