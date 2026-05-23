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
import { SAMPLE_UNIFIED_DIFF } from "@/lib/patch/defaults"
import {
  formatPatchSummaryMarkdown,
  parseUnifiedDiff,
} from "@/lib/patch/parse"
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

export function PatchApp() {
  const [input, setInput] = React.useState(SAMPLE_UNIFIED_DIFF)

  const result = React.useMemo(() => parseUnifiedDiff(input), [input])

  async function copySummary() {
    if (result.files.length === 0) {
      toast.error("Nothing to copy yet.")
      return
    }
    try {
      await navigator.clipboard.writeText(formatPatchSummaryMarkdown(result))
      toast.success("Copied markdown summary.")
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
              Patch lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste unified diff output to count files, additions, and
              deletions—handy for reviewing agent or PR patches.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unified diff</CardTitle>
          <CardDescription>
            Works with <code className="text-xs">git diff</code>,{" "}
            <code className="text-xs">git show</code>, and{" "}
            <code className="text-xs">.patch</code> files.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="patch-input">Diff text</FieldLabel>
            <FieldContent>
              <Textarea
                id="patch-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
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
              onClick={() => setInput(SAMPLE_UNIFIED_DIFF)}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("")}
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
              onClick={() => void copySummary()}
              disabled={result.files.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy summary
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
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

          {result.files.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow
                  label="Files changed"
                  value={result.summary.fileCount}
                />
                <StatRow
                  label="Lines added"
                  value={
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{result.summary.additions}
                    </span>
                  }
                />
                <StatRow
                  label="Lines removed"
                  value={
                    <span className="text-rose-600 dark:text-rose-400">
                      −{result.summary.deletions}
                    </span>
                  }
                />
                {result.summary.binaryCount > 0 && (
                  <StatRow
                    label="Binary files"
                    value={result.summary.binaryCount}
                  />
                )}
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">+</TableHead>
                      <TableHead className="text-right">−</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.files.map((file) => (
                      <TableRow key={file.path}>
                        <TableCell className="max-w-[14rem] truncate font-mono text-xs sm:max-w-xs">
                          {file.path}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {file.binary ? "—" : file.additions}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {file.binary ? "—" : file.deletions}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {file.isNew && (
                              <Badge variant="secondary">new</Badge>
                            )}
                            {file.isDeleted && (
                              <Badge variant="secondary">deleted</Badge>
                            )}
                            {file.isRename && (
                              <Badge variant="secondary">rename</Badge>
                            )}
                            {file.binary && (
                              <Badge variant="outline">binary</Badge>
                            )}
                          </div>
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
