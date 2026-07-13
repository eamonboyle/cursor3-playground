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
import {
  SAMPLE_FUZZY_CANDIDATES,
  SAMPLE_FUZZY_QUERIES,
} from "@/lib/fuzzy/defaults"
import {
  findFuzzyMatchesBatch,
  formatFuzzyMatchMarkdown,
  formatFuzzyMatchPaths,
} from "@/lib/fuzzy/match"
import type { FuzzyMatchReason } from "@/lib/fuzzy/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  SearchIcon,
} from "@hugeicons/core-free-icons"

const REASON_LABEL: Record<FuzzyMatchReason, string> = {
  exact: "Exact",
  "case-insensitive": "Case",
  basename: "Basename",
  suffix: "Suffix",
  levenshtein: "Edit distance",
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

export function FuzzyApp() {
  const [queries, setQueries] = React.useState(SAMPLE_FUZZY_QUERIES)
  const [candidates, setCandidates] = React.useState(SAMPLE_FUZZY_CANDIDATES)

  const result = React.useMemo(
    () => findFuzzyMatchesBatch(queries, candidates),
    [queries, candidates],
  )

  const hasMatches = result.queries.some((q) => q.matches.length > 0)

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
            icon={SearchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Fuzzy path lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Fix misspelled or partial repo paths against a file list — rank
              closest matches for Cursor citations and imports.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Misspelled paths</CardTitle>
          <CardDescription>
            Paste wrong paths from agent output, build logs, or{" "}
            <code className="text-xs">file:line</code> ripgrep hits — one per
            line.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="fuzzy-queries">Queries</FieldLabel>
            <FieldContent>
              <Textarea
                id="fuzzy-queries"
                value={queries}
                onChange={(e) => setQueries(e.target.value)}
                rows={6}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="fuzzy-candidates">Candidate paths</FieldLabel>
            <FieldContent>
              <Textarea
                id="fuzzy-candidates"
                value={candidates}
                onChange={(e) => setCandidates(e.target.value)}
                rows={12}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQueries(SAMPLE_FUZZY_QUERIES)
                setCandidates(SAMPLE_FUZZY_CANDIDATES)
              }}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQueries("")
                setCandidates("")
              }}
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
                  "Copied markdown summary.",
                  formatFuzzyMatchMarkdown(result),
                )
              }
              disabled={!hasMatches}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy summary
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied best-match paths.",
                  formatFuzzyMatchPaths(result),
                )
              }
              disabled={!hasMatches}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy best matches
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <p
                  key={warning}
                  className="text-muted-foreground text-sm leading-relaxed"
                >
                  {warning}
                </p>
              ))}
            </div>
          )}

          {result.queries.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Queries" value={result.queries.length} />
                <StatRow
                  label="Candidates"
                  value={result.candidates.length}
                />
                <StatRow
                  label="Resolved"
                  value={
                    result.queries.filter((q) => q.matches.length > 0).length
                  }
                />
              </div>

              <Separator />

              {result.queries.map((queryResult) => (
                <div key={queryResult.query} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {queryResult.query}
                    </span>
                    {queryResult.matches.length === 0 && (
                      <Badge variant="outline">No match</Badge>
                    )}
                  </div>

                  {queryResult.matches.length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Path</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead className="text-right">
                              Distance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryResult.matches.map((match) => (
                            <TableRow key={`${queryResult.query}-${match.path}`}>
                              <TableCell className="max-w-[14rem] truncate font-mono text-xs sm:max-w-lg">
                                {match.path}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {REASON_LABEL[match.reason]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs tabular-nums">
                                {match.distance}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
