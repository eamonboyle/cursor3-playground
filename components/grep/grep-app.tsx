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
  SAMPLE_GREP_CONTEXT,
  SAMPLE_GREP_OUTPUT,
} from "@/lib/grep/defaults"
import {
  formatGrepFiles,
  formatGrepMarkdown,
  formatGrepPaths,
  hitLocation,
  parseGrepOutput,
} from "@/lib/grep/parse"
import type { GrepHit } from "@/lib/grep/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  SearchIcon,
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

function HitRow({
  hit,
  onCopy,
}: {
  hit: GrepHit
  onCopy: (text: string) => void
}) {
  const loc = hitLocation(hit)
  return (
    <TableRow>
      <TableCell>
        <Badge variant={hit.kind === "match" ? "default" : "outline"}>
          {hit.kind === "match" ? "match" : "ctx"}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs">
        {hit.path}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">{hit.line}</TableCell>
      <TableCell className="max-w-[16rem] truncate text-sm">{hit.text}</TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(loc)}
          aria-label={`Copy ${loc}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function GrepApp() {
  const [input, setInput] = React.useState(SAMPLE_GREP_OUTPUT)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)
  const [matchesOnly, setMatchesOnly] = React.useState(true)
  const [extensionFilter, setExtensionFilter] = React.useState("")

  const result = React.useMemo(
    () =>
      parseGrepOutput(input, {
        hideNodeModules,
        matchesOnly,
        extensionFilter,
      }),
    [input, hideNodeModules, matchesOnly, extensionFilter],
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

  const topExtensions = Object.entries(result.summary.byExtension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={SearchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Ripgrep hits lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">rg -n</code> or{" "}
              <code className="text-xs">rg -C</code> output — group by file,
              filter extensions, and copy file:line paths for Cursor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.summary.matchCount} match
            {result.summary.matchCount === 1 ? "" : "es"}
          </Badge>
          <Badge variant="outline">{result.summary.fileCount} file(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search output</CardTitle>
          <CardDescription>
            Supports inline <code className="text-xs">path:line:text</code> hits
            and ripgrep context blocks from <code className="text-xs">-C</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="grep-output">Ripgrep log</FieldLabel>
            <FieldContent>
              <Textarea
                id="grep-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste rg -n output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="grep-hide-modules"
                  checked={hideNodeModules}
                  onCheckedChange={setHideNodeModules}
                />
                <FieldLabel
                  htmlFor="grep-hide-modules"
                  className="mb-0 cursor-pointer"
                >
                  Hide node_modules
                </FieldLabel>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="grep-matches-only"
                  checked={matchesOnly}
                  onCheckedChange={setMatchesOnly}
                />
                <FieldLabel
                  htmlFor="grep-matches-only"
                  className="mb-0 cursor-pointer"
                >
                  Matches only
                </FieldLabel>
              </div>
            </div>
            <Field className="max-w-xs">
              <FieldLabel htmlFor="grep-extension">Extension filter</FieldLabel>
              <FieldContent>
                <Input
                  id="grep-extension"
                  value={extensionFilter}
                  onChange={(e) => setExtensionFilter(e.target.value)}
                  placeholder=".ts, .tsx"
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
                setInput(SAMPLE_GREP_OUTPUT)
                toast.message("Loaded inline sample.")
              }}
            >
              Load inline sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_GREP_CONTEXT)
                toast.message("Loaded context sample.")
              }}
            >
              Load context sample
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
                  "Copied paths (one per line).",
                  formatGrepPaths(result),
                )
              }
              disabled={result.summary.matchCount === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy paths
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied unique file paths.",
                  formatGrepFiles(result),
                )
              }
              disabled={result.summary.fileCount === 0}
            >
              Copy files
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatGrepMarkdown(result),
                )
              }
              disabled={result.hits.length === 0}
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
          <StatRow label="Total lines" value={result.summary.total} />
          <StatRow label="Matches" value={result.summary.matchCount} />
          <StatRow label="Context lines" value={result.summary.contextCount} />
          <StatRow label="Files" value={result.summary.fileCount} />
          {topExtensions.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {topExtensions.map(([ext, count]) => (
                <Badge key={ext} variant="outline">
                  {ext} × {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hits by file</CardTitle>
          <CardDescription>
            Grouped in paste order — copy a row for a single location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.hits.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hits yet. Paste ripgrep output or load a sample.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {result.groups.map((group) => (
                <div key={group.path} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-medium">{group.path}</code>
                    <Badge variant="outline">{group.hits.length}</Badge>
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kind</TableHead>
                          <TableHead>File</TableHead>
                          <TableHead>Line</TableHead>
                          <TableHead>Snippet</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.hits.map((hit, index) => (
                          <HitRow
                            key={`${hit.sourceLine}-${hit.line}-${index}`}
                            hit={hit}
                            onCopy={(text) =>
                              void copyText("Copied location.", text)
                            }
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
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
          rg -n &quot;pattern&quot; --glob &apos;!node_modules&apos;
        </code>
        , paste the output here, then copy paths into agent context.
      </p>
    </div>
  )
}
