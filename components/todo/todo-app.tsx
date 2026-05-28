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
import { SAMPLE_TODO_SCAN } from "@/lib/todo/defaults"
import {
  formatTodoScanMarkdown,
  formatTodoScanPaths,
  markerLocation,
  parseTodoScan,
  TODO_TAGS,
} from "@/lib/todo/parse"
import type { TodoTag } from "@/lib/todo/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons"

const TAG_VARIANT: Record<
  TodoTag,
  "default" | "secondary" | "destructive" | "outline"
> = {
  TODO: "secondary",
  FIXME: "destructive",
  HACK: "outline",
  XXX: "outline",
  BUG: "destructive",
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

export function TodoApp() {
  const [input, setInput] = React.useState(SAMPLE_TODO_SCAN)

  const result = React.useMemo(() => parseTodoScan(input), [input])

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
            icon={Task01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              TODO marker lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste ripgrep or grep output to list TODO, FIXME, HACK, XXX, and
              BUG markers with copyable paths for Cursor.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan input</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">
              rg -n &quot;TODO|FIXME|HACK|XXX|BUG&quot; --glob
              &apos;!node_modules&apos;
            </code>{" "}
            and paste the results, or paste raw comment lines.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="todo-input">Grep output</FieldLabel>
            <FieldContent>
              <Textarea
                id="todo-input"
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
              onClick={() => setInput(SAMPLE_TODO_SCAN)}
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
                  formatTodoScanMarkdown(result),
                )
              }
              disabled={result.markers.length === 0}
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
                  "Copied file:line paths.",
                  formatTodoScanPaths(result),
                )
              }
              disabled={result.markers.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy paths
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

          {result.markers.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Markers" value={result.summary.total} />
                {TODO_TAGS.map((tag) =>
                  result.summary.byTag[tag] > 0 ? (
                    <StatRow
                      key={tag}
                      label={tag}
                      value={result.summary.byTag[tag]}
                    />
                  ) : null,
                )}
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.markers.map((marker, index) => (
                      <TableRow key={`${marker.sourceLine}-${index}`}>
                        <TableCell>
                          <Badge variant={TAG_VARIANT[marker.tag]}>
                            {marker.tag}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs sm:max-w-md">
                          {markerLocation(marker)}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate text-xs">
                          {marker.message || "—"}
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
