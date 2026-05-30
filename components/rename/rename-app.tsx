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
  SAMPLE_RENAME_PATHS,
  SAMPLE_RENAME_RULES,
} from "@/lib/rename/defaults"
import {
  applyRenameMap,
  formatRenameMapMarkdown,
  formatRenameMapOutput,
} from "@/lib/rename/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  FolderEditIcon,
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

export function RenameApp() {
  const [rules, setRules] = React.useState(SAMPLE_RENAME_RULES)
  const [paths, setPaths] = React.useState(SAMPLE_RENAME_PATHS)

  const result = React.useMemo(
    () => applyRenameMap(rules, paths),
    [rules, paths],
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
            icon={FolderEditIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Rename map lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Apply file-move rules to pasted paths, ripgrep hits, or stack
              frames after a refactor — copy updated lines for Cursor.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rename rules</CardTitle>
          <CardDescription>
            One rule per line:{" "}
            <code className="text-xs">old/path =&gt; new/path</code>,{" "}
            <code className="text-xs">-&gt;</code>, git{" "}
            <code className="text-xs">R100 from to</code>, or tab-separated.
            Directory rules rewrite nested paths.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="rename-rules">Rules</FieldLabel>
            <FieldContent>
              <Textarea
                id="rename-rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={5}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paths to rewrite</CardTitle>
          <CardDescription>
            Paste plain paths, ripgrep lines, or stack{" "}
            <code className="text-xs">file:line</code> entries from before the
            move.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="rename-paths">Input</FieldLabel>
            <FieldContent>
              <Textarea
                id="rename-paths"
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
                setRules(SAMPLE_RENAME_RULES)
                setPaths(SAMPLE_RENAME_PATHS)
              }}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRules("")
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
                  "Copied markdown summary.",
                  formatRenameMapMarkdown(result),
                )
              }
              disabled={result.paths.length === 0}
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
                  "Copied rewritten paths.",
                  formatRenameMapOutput(result),
                )
              }
              disabled={result.paths.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy output
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

          {result.paths.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Lines" value={result.summary.total} />
                <StatRow label="Updated" value={result.summary.changed} />
                <StatRow label="Unchanged" value={result.summary.unchanged} />
                <StatRow label="Rules" value={result.rules.length} />
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Before</TableHead>
                      <TableHead>After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.paths.map((row, index) => (
                      <TableRow key={`${row.sourceLine}-${index}`}>
                        <TableCell>
                          <Badge
                            variant={row.changed ? "default" : "secondary"}
                          >
                            {row.changed ? "updated" : "same"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs sm:max-w-xs">
                          {row.before || "—"}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs sm:max-w-md">
                          {row.after || "—"}
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
