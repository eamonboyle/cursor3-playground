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
import { SAMPLE_LOC_SCAN } from "@/lib/loc/defaults"
import {
  formatLocLargestPaths,
  formatLocMarkdown,
  formatLocPaths,
  parseLocScan,
} from "@/lib/loc/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  TextAlignLeftIcon,
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

export function LocApp() {
  const [input, setInput] = React.useState(SAMPLE_LOC_SCAN)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)
  const [extensionFilter, setExtensionFilter] = React.useState("")
  const [minLines, setMinLines] = React.useState("")

  const result = React.useMemo(() => {
    const parsedMin = minLines.trim() ? Number(minLines) : 0
    return parseLocScan(input, {
      hideNodeModules,
      extensionFilter,
      minLines: Number.isNaN(parsedMin) ? 0 : parsedMin,
    })
  }, [input, hideNodeModules, extensionFilter, minLines])

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

  const extensionRows = Object.entries(result.summary.byExtension).sort(
    (a, b) => b[1] - a[1],
  )
  const topDirRows = Object.entries(result.summary.byTopDir).sort(
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
            icon={TextAlignLeftIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Line count lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste wc -l or find output to rank files by size, group by
              extension or top-level folder, and copy paths for refactor scope.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line count input</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">
              find lib components app -name &apos;*.&apos;{"{"}ts,tsx{"}"} -exec
              wc -l {"{}"} +
            </code>{" "}
            and paste the output. Also accepts path&lt;TAB&gt;lines pairs or{" "}
            <code className="text-xs">rg --count</code> results.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="loc-input">wc / count output</FieldLabel>
            <FieldContent>
              <Textarea
                id="loc-input"
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
              <FieldLabel htmlFor="loc-ext">Extension filter</FieldLabel>
              <FieldContent>
                <Input
                  id="loc-ext"
                  placeholder=".ts or tsx"
                  value={extensionFilter}
                  onChange={(e) => setExtensionFilter(e.target.value)}
                  className="font-mono text-sm"
                />
              </FieldContent>
            </Field>
            <Field className="w-full sm:w-32">
              <FieldLabel htmlFor="loc-min">Min lines</FieldLabel>
              <FieldContent>
                <Input
                  id="loc-min"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minLines}
                  onChange={(e) => setMinLines(e.target.value)}
                  className="font-mono text-sm"
                />
              </FieldContent>
            </Field>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="loc-nm"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel htmlFor="loc-nm" className="mb-0 cursor-pointer">
                Hide node_modules
              </FieldLabel>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_LOC_SCAN)}
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
                  formatLocMarkdown(result),
                )
              }
              disabled={result.entries.length === 0}
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
                  "Copied path:line counts.",
                  formatLocPaths(result),
                )
              }
              disabled={result.entries.length === 0}
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
                  "Copied largest file paths.",
                  formatLocLargestPaths(result, 10),
                )
              }
              disabled={result.entries.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy top 10
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

          {result.entries.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow
                  label="Total lines"
                  value={result.summary.totalLines.toLocaleString()}
                />
                <StatRow label="Files" value={result.summary.fileCount} />
                {result.entries[0] && (
                  <StatRow
                    label="Largest file"
                    value={`${result.entries[0].path} (${result.entries[0].lines.toLocaleString()})`}
                  />
                )}
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">By extension</p>
                  <div className="flex flex-wrap gap-2">
                    {extensionRows.map(([ext, count]) => (
                      <Badge key={ext} variant="secondary" className="font-mono">
                        {ext}: {count.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">By top-level dir</p>
                  <div className="flex flex-wrap gap-2">
                    {topDirRows.map(([dir, count]) => (
                      <Badge key={dir} variant="outline" className="font-mono">
                        {dir}/: {count.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Lines</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.entries.map((entry, index) => (
                      <TableRow key={`${entry.path}-${entry.sourceLine}`}>
                        <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                          {index + 1}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs sm:max-w-md">
                          {entry.path}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {entry.lines.toLocaleString()}
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
