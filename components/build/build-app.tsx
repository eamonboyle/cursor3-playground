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
import { SAMPLE_BUILD_OUTPUT } from "@/lib/build/defaults"
import {
  errorLocation,
  formatBuildMarkdown,
  formatBuildPaths,
  parseBuildOutput,
} from "@/lib/build/parse"
import type { BuildError } from "@/lib/build/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Wrench01Icon,
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

function kindVariant(
  kind: BuildError["kind"],
): "destructive" | "secondary" | "outline" {
  if (kind === "type-error" || kind === "syntax-error") {
    return "destructive"
  }
  if (kind === "module-not-found") {
    return "secondary"
  }
  return "outline"
}

function ErrorRow({
  error,
  onCopy,
}: {
  error: BuildError
  onCopy: (text: string) => void
}) {
  const loc = errorLocation(error)
  return (
    <TableRow>
      <TableCell>
        <Badge variant={kindVariant(error.kind)} className="font-mono text-[0.65rem]">
          {error.kind}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs">
        {error.path ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {error.line ?? "—"}
      </TableCell>
      <TableCell className="max-w-[14rem] truncate text-sm">
        {error.module ? (
          <span title={error.module}>
            missing <code className="text-xs">{error.module}</code>
          </span>
        ) : (
          error.message
        )}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(loc)}
          aria-label={`Copy ${loc}`}
          disabled={!error.path}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function BuildApp() {
  const [input, setInput] = React.useState(SAMPLE_BUILD_OUTPUT)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)

  const result = React.useMemo(
    () => parseBuildOutput(input, { hideNodeModules }),
    [input, hideNodeModules],
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

  const topKinds = (
    Object.entries(result.summary.byKind) as [BuildError["kind"], number][]
  )
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Wrench01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Build output lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">pnpm build</code> or{" "}
              <code className="text-xs">next build</code> output — group compile
              errors, filter node_modules, and copy file:line paths for Cursor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge
            variant={result.summary.total > 0 ? "destructive" : "secondary"}
          >
            {result.summary.total} error
            {result.summary.total === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">{result.fileCount} file(s)</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build log</CardTitle>
          <CardDescription>
            Supports Next.js Turbopack/webpack output — type errors, module
            resolution failures, and generic compile errors with ANSI colors.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="build-output">Build output</FieldLabel>
            <FieldContent>
              <Textarea
                id="build-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste next build output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="build-hide-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel
                htmlFor="build-hide-modules"
                className="mb-0 cursor-pointer"
              >
                Hide node_modules
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_BUILD_OUTPUT)
                  toast.message("Loaded sample build output.")
                }}
              >
                Load sample
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
                    formatBuildPaths(result),
                  )
                }
                disabled={result.unique.length === 0}
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
                    "Copied markdown report.",
                    formatBuildMarkdown(result),
                  )
                }
                disabled={result.errors.length === 0}
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
          <StatRow label="Errors" value={result.summary.total} />
          <StatRow label="Unique locations" value={result.unique.length} />
          <StatRow label="Files touched" value={result.fileCount} />
          {topKinds.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {topKinds.map(([kind, count]) => (
                <Badge key={kind} variant="outline">
                  {kind} × {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Errors</CardTitle>
          <CardDescription>
            Sorted in paste order — use copy on a row for a single location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.errors.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No errors yet. Paste build output or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kind</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errors.map((e, index) => (
                    <ErrorRow
                      key={`${e.sourceLine}-${e.kind}-${index}`}
                      error={e}
                      onCopy={(text) => void copyText("Copied location.", text)}
                    />
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
        Tip: run <code className="rounded bg-muted px-1">pnpm build</code>{" "}
        locally, paste the log here, then copy paths into agent context.
      </p>
    </div>
  )
}
