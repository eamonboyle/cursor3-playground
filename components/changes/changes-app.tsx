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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  SAMPLE_CHANGES_NAME_ONLY,
  SAMPLE_CHANGES_NAME_STATUS,
} from "@/lib/changes/defaults"
import {
  CHANGE_STATUSES,
  fileDisplayPath,
  formatChangesMarkdown,
  formatChangesPaths,
  formatChangesPrScope,
  parseChangesOutput,
} from "@/lib/changes/parse"
import type { ChangeStatus } from "@/lib/changes/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  FileEditIcon,
} from "@hugeicons/core-free-icons"

const STATUS_VARIANT: Record<
  ChangeStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  added: "default",
  modified: "secondary",
  deleted: "destructive",
  renamed: "outline",
  copied: "outline",
  typechanged: "outline",
  unmerged: "destructive",
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

export function ChangesApp() {
  const [input, setInput] = React.useState(SAMPLE_CHANGES_NAME_STATUS)
  const [hideNodeModules, setHideNodeModules] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<ChangeStatus | "all">(
    "all",
  )
  const [extensionFilter, setExtensionFilter] = React.useState("")

  const result = React.useMemo(
    () =>
      parseChangesOutput(input, {
        hideNodeModules,
        statusFilter,
        extensionFilter,
      }),
    [input, hideNodeModules, statusFilter, extensionFilter],
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
            icon={FileEditIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Changed files lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste git diff name-status or name-only output to scope PR
              reviews, filter by extension, and copy paths for Cursor.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diff input</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">git diff --name-status main...HEAD</code>{" "}
            or{" "}
            <code className="text-xs">git diff --name-only main...HEAD</code>{" "}
            and paste the results.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="changes-input">Git output</FieldLabel>
            <FieldContent>
              <Textarea
                id="changes-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="hide-node-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel htmlFor="hide-node-modules" className="mb-0">
                Hide node_modules
              </FieldLabel>
            </div>

            <Field className="w-40">
              <FieldLabel htmlFor="status-filter">Status</FieldLabel>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as ChangeStatus | "all")
                }
              >
                <SelectTrigger id="status-filter" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {CHANGE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="w-32">
              <FieldLabel htmlFor="extension-filter">Extension</FieldLabel>
              <Input
                id="extension-filter"
                value={extensionFilter}
                onChange={(e) => setExtensionFilter(e.target.value)}
                placeholder=".ts"
                className="h-8 font-mono text-xs"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_CHANGES_NAME_STATUS)}
            >
              Load name-status sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_CHANGES_NAME_ONLY)}
            >
              Load name-only sample
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
                  formatChangesMarkdown(result),
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
                  formatChangesPaths(result),
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
                  "Copied PR scope section.",
                  formatChangesPrScope(result),
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
              Copy PR scope
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
                <StatRow label="Files" value={result.summary.total} />
                {CHANGE_STATUSES.map((status) =>
                  result.summary.byStatus[status] > 0 ? (
                    <StatRow
                      key={status}
                      label={status}
                      value={result.summary.byStatus[status]}
                    />
                  ) : null,
                )}
              </div>

              {extensionRows.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      By extension
                    </p>
                    {extensionRows.map(([ext, count]) => (
                      <StatRow key={ext} label={ext} value={count} />
                    ))}
                  </div>
                </>
              )}

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.files.map((file, index) => (
                      <TableRow key={`${file.sourceLine}-${index}`}>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[file.status]}>
                            {file.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate font-mono text-xs">
                          {fileDisplayPath(file)}
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
