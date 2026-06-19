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
import { SAMPLE_COVERAGE_SCAN } from "@/lib/coverage/defaults"
import {
  formatCoverageMarkdown,
  formatCoveragePaths,
  formatCoverageUncovered,
  parseCoverageScan,
} from "@/lib/coverage/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChartBarLineIcon,
  Copy01Icon,
  Delete02Icon,
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

function pctBadge(value: number | null) {
  if (value === null) {
    return <Badge variant="outline">—</Badge>
  }
  if (value >= 90) {
    return <Badge variant="secondary">{value}%</Badge>
  }
  if (value >= 70) {
    return <Badge variant="outline">{value}%</Badge>
  }
  return <Badge variant="destructive">{value}%</Badge>
}

export function CoverageApp() {
  const [input, setInput] = React.useState(SAMPLE_COVERAGE_SCAN)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)
  const [extensionFilter, setExtensionFilter] = React.useState("")
  const [maxLinesPct, setMaxLinesPct] = React.useState("")

  const result = React.useMemo(() => {
    const parsedMax = maxLinesPct.trim() ? Number(maxLinesPct) : undefined
    return parseCoverageScan(input, {
      hideNodeModules,
      extensionFilter,
      maxLinesPct:
        parsedMax !== undefined && !Number.isNaN(parsedMax)
          ? parsedMax
          : undefined,
    })
  }, [input, hideNodeModules, extensionFilter, maxLinesPct])

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
            icon={ChartBarLineIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Coverage lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste Vitest, Jest, or c8 text coverage tables — rank files by
              lines %, filter gaps, and copy paths for test work in Cursor.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coverage input</CardTitle>
          <CardDescription>
            Run tests with coverage enabled, e.g.{" "}
            <code className="text-xs">vitest run --coverage</code> or{" "}
            <code className="text-xs">jest --coverage</code>, and paste the
            Istanbul-style text table.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="coverage-input">Coverage output</FieldLabel>
            <FieldContent>
              <Textarea
                id="coverage-input"
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
              <FieldLabel htmlFor="coverage-ext">Extension filter</FieldLabel>
              <FieldContent>
                <Input
                  id="coverage-ext"
                  placeholder=".ts or tsx"
                  value={extensionFilter}
                  onChange={(e) => setExtensionFilter(e.target.value)}
                  className="font-mono text-sm"
                />
              </FieldContent>
            </Field>
            <Field className="w-full sm:w-36">
              <FieldLabel htmlFor="coverage-max">Max lines %</FieldLabel>
              <FieldContent>
                <Input
                  id="coverage-max"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 80"
                  value={maxLinesPct}
                  onChange={(e) => setMaxLinesPct(e.target.value)}
                  className="font-mono text-sm"
                />
              </FieldContent>
            </Field>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="coverage-nm"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel htmlFor="coverage-nm" className="mb-0 cursor-pointer">
                Hide node_modules
              </FieldLabel>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_COVERAGE_SCAN)}
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
              onClick={() =>
                void copyText(
                  "Copied markdown summary.",
                  formatCoverageMarkdown(result),
                )
              }
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied file paths.",
                  formatCoveragePaths(result),
                )
              }
              disabled={result.files.length === 0}
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
                  "Copied uncovered line ranges.",
                  formatCoverageUncovered(result),
                )
              }
              disabled={!formatCoverageUncovered(result).trim()}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy uncovered
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

          {result.files.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Files" value={result.summary.fileCount} />
                <StatRow
                  label="Avg lines %"
                  value={
                    result.summary.avgLines !== null
                      ? `${result.summary.avgLines}%`
                      : "—"
                  }
                />
                {maxLinesPct.trim() && (
                  <StatRow
                    label={`At or below ${maxLinesPct}%`}
                    value={result.summary.belowThreshold}
                  />
                )}
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Stmts</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Funcs</TableHead>
                      <TableHead>Lines</TableHead>
                      <TableHead>Uncovered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.files.map((file, index) => (
                      <TableRow key={`${file.path}-${file.sourceLine}`}>
                        <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                          {index + 1}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs sm:max-w-xs">
                          {file.path}
                        </TableCell>
                        <TableCell>{pctBadge(file.statements)}</TableCell>
                        <TableCell>{pctBadge(file.branches)}</TableCell>
                        <TableCell>{pctBadge(file.functions)}</TableCell>
                        <TableCell>{pctBadge(file.lines)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[8rem] truncate font-mono text-xs sm:max-w-xs">
                          {file.uncoveredLines || "—"}
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
