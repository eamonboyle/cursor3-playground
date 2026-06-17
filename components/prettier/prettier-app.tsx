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
  SAMPLE_PRETTIER_CHECK,
  SAMPLE_PRETTIER_LIST,
} from "@/lib/prettier/defaults"
import {
  formatPrettierMarkdown,
  formatPrettierPaths,
  formatPrettierWriteCommand,
  parsePrettierOutput,
} from "@/lib/prettier/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  SourceCodeIcon,
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

export function PrettierApp() {
  const [input, setInput] = React.useState(SAMPLE_PRETTIER_CHECK)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)
  const [extensionFilter, setExtensionFilter] = React.useState("")

  const result = React.useMemo(
    () =>
      parsePrettierOutput(input, {
        hideNodeModules,
        extensionFilter,
      }),
    [input, hideNodeModules, extensionFilter],
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

  const extensionRows = Object.entries(result.summary.byExtension).sort(
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
            icon={SourceCodeIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Prettier output lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">prettier --check</code> or{" "}
              <code className="text-xs">--list-different</code> output — list
              unformatted files, filter extensions, and copy fix commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          {result.summary.allFormatted ? (
            <Badge variant="secondary">All formatted</Badge>
          ) : (
            <Badge variant="secondary">
              {result.summary.fileCount} unformatted
            </Badge>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prettier output</CardTitle>
          <CardDescription>
            Supports <code className="text-xs">[warn] path</code> lines from{" "}
            <code className="text-xs">--check</code>, one path per line from{" "}
            <code className="text-xs">--list-different</code>, or plain file
            paths.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="prettier-output">Terminal log</FieldLabel>
            <FieldContent>
              <Textarea
                id="prettier-output"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste prettier --check output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="prettier-hide-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel
                htmlFor="prettier-hide-modules"
                className="mb-0 cursor-pointer"
              >
                Hide node_modules
              </FieldLabel>
            </div>
            <Field className="max-w-xs">
              <FieldLabel htmlFor="prettier-extension">
                Extension filter
              </FieldLabel>
              <FieldContent>
                <Input
                  id="prettier-extension"
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
                setInput(SAMPLE_PRETTIER_CHECK)
                toast.message("Loaded --check sample.")
              }}
            >
              Load --check sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(SAMPLE_PRETTIER_LIST)
                toast.message("Loaded --list-different sample.")
              }}
            >
              Load list sample
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
                  "Copied file paths.",
                  formatPrettierPaths(result),
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
                  "Copied pnpm format command.",
                  formatPrettierWriteCommand(result),
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
              Copy fix command
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatPrettierMarkdown(result),
                )
              }
              disabled={
                result.files.length === 0 && !result.summary.allFormatted
              }
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
          <StatRow label="Unformatted files" value={result.summary.fileCount} />
          <StatRow
            label="Status"
            value={
              result.summary.allFormatted ? "All formatted" : "Needs formatting"
            }
          />
          {extensionRows.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {extensionRows.map(([ext, count]) => (
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
          <CardTitle className="text-base">Unformatted files</CardTitle>
          <CardDescription>
            Files that need Prettier — copy paths or the fix command above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.files.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {result.summary.allFormatted
                ? "All matched files use Prettier code style."
                : "No unformatted files yet. Paste prettier output or load a sample."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.files.map((entry, index) => (
                    <TableRow key={`${entry.path}-${entry.sourceLine}`}>
                      <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate font-mono text-xs sm:max-w-md">
                        {entry.path}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            void copyText("Copied path.", entry.path)
                          }
                          aria-label={`Copy ${entry.path}`}
                        >
                          <HugeiconsIcon
                            icon={Copy01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
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
        Tip: run{" "}
        <code className="rounded bg-muted px-1">
          {`pnpm exec prettier --check "**/*.{ts,tsx}"`}
        </code>
        , paste the output here, then copy the fix command for agent context.
      </p>
    </div>
  )
}
