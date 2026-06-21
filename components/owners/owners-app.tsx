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
  SAMPLE_CHANGED_PATHS,
  SAMPLE_CODEOWNERS,
} from "@/lib/owners/defaults"
import {
  formatCodeownersMarkdown,
  formatReviewRequest,
  formatUnownedPaths,
  resolveCodeowners,
} from "@/lib/owners/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  UserGroupIcon,
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

export function OwnersApp() {
  const [codeowners, setCodeowners] = React.useState(SAMPLE_CODEOWNERS)
  const [paths, setPaths] = React.useState(SAMPLE_CHANGED_PATHS)

  const result = React.useMemo(
    () => resolveCodeowners(codeowners, paths),
    [codeowners, paths],
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
            icon={UserGroupIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              CODEOWNERS lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste a CODEOWNERS file and changed paths to map PR files to
              reviewers — last matching rule wins, like GitHub.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
          <CardDescription>
            Use{" "}
            <code className="text-xs">git diff --name-only origin/main</code>{" "}
            for changed paths. Rules follow gitignore-style globs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="owners-codeowners">CODEOWNERS</FieldLabel>
            <FieldContent>
              <Textarea
                id="owners-codeowners"
                value={codeowners}
                onChange={(e) => setCodeowners(e.target.value)}
                rows={12}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="owners-paths">Changed paths</FieldLabel>
            <FieldContent>
              <Textarea
                id="owners-paths"
                value={paths}
                onChange={(e) => setPaths(e.target.value)}
                rows={10}
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
                setCodeowners(SAMPLE_CODEOWNERS)
                setPaths(SAMPLE_CHANGED_PATHS)
              }}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCodeowners("")
                setPaths("")
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
                  "Copied review request.",
                  formatReviewRequest(result),
                )
              }
              disabled={result.byOwner.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy @reviewers
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown summary.",
                  formatCodeownersMarkdown(result),
                )
              }
              disabled={result.matches.length === 0}
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
                  "Copied unowned paths.",
                  formatUnownedPaths(result),
                )
              }
              disabled={result.unowned.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy unowned
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

          {result.matches.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Changed files" value={result.summary.totalPaths} />
                <StatRow label="Owned" value={result.summary.owned} />
                <StatRow label="Unowned" value={result.summary.unowned} />
                <StatRow label="Reviewers" value={result.summary.uniqueOwners} />
                <StatRow label="Rules" value={result.summary.ruleCount} />
              </div>

              {result.byOwner.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-medium">By owner</h3>
                    {result.byOwner.map((group) => (
                      <div
                        key={group.owner}
                        className="rounded-md border p-3 text-sm"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {group.owner}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {group.paths.length} file
                            {group.paths.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <ul className="text-muted-foreground flex flex-col gap-1 font-mono text-xs">
                          {group.paths.map((path) => (
                            <li key={path}>{path}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead>Owners</TableHead>
                      <TableHead>Matched rule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.matches.map((match) => (
                      <TableRow key={match.path}>
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs sm:max-w-md">
                          {match.path}
                        </TableCell>
                        <TableCell>
                          {match.owners.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {match.owners.map((owner) => (
                                <Badge
                                  key={owner}
                                  variant="outline"
                                  className="font-mono text-[0.65rem]"
                                >
                                  {owner}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[10rem] truncate font-mono text-xs">
                          {match.matchedPattern ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
