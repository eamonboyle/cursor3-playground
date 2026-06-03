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
  SAMPLE_CITATION_BUILD,
  SAMPLE_CITATION_SCAN,
} from "@/lib/citation/defaults"
import {
  buildCitation,
  formatCitationScanBlocks,
  formatCitationScanMarkdown,
  parseCitationScan,
} from "@/lib/citation/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  QuoteDownIcon,
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

export function CitationApp() {
  const [scanInput, setScanInput] = React.useState(SAMPLE_CITATION_SCAN)
  const [filepath, setFilepath] = React.useState(SAMPLE_CITATION_BUILD.filepath)
  const [startLine, setStartLine] = React.useState(
    String(SAMPLE_CITATION_BUILD.startLine),
  )
  const [endLine, setEndLine] = React.useState(
    String(SAMPLE_CITATION_BUILD.endLine),
  )
  const [code, setCode] = React.useState(SAMPLE_CITATION_BUILD.code)

  const scanResult = React.useMemo(
    () => parseCitationScan(scanInput),
    [scanInput],
  )

  const builtBlock = React.useMemo(() => {
    const start = Number(startLine)
    const end = Number(endLine)
    if (!filepath.trim() || Number.isNaN(start) || Number.isNaN(end)) {
      return ""
    }
    return buildCitation({
      filepath,
      startLine: start,
      endLine: end,
      code: code.trim() || undefined,
    })
  }, [filepath, startLine, endLine, code])

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
            icon={QuoteDownIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Citation lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Build and validate Cursor code citations (
              <code className="text-xs">startLine:endLine:filepath</code>
              ) from ripgrep hits or scratch fields.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build citation</CardTitle>
          <CardDescription>
            Fence format agents use when citing existing code in replies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="citation-path">File path</FieldLabel>
              <FieldContent>
                <Input
                  id="citation-path"
                  value={filepath}
                  onChange={(e) => setFilepath(e.target.value)}
                  className="font-mono text-sm"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="citation-start">Start line</FieldLabel>
              <FieldContent>
                <Input
                  id="citation-start"
                  type="number"
                  min={1}
                  value={startLine}
                  onChange={(e) => setStartLine(e.target.value)}
                  className="font-mono text-sm tabular-nums"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="citation-end">End line</FieldLabel>
              <FieldContent>
                <Input
                  id="citation-end"
                  type="number"
                  min={1}
                  value={endLine}
                  onChange={(e) => setEndLine(e.target.value)}
                  className="font-mono text-sm tabular-nums"
                />
              </FieldContent>
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setFilepath(SAMPLE_CITATION_BUILD.filepath)
                  setStartLine(String(SAMPLE_CITATION_BUILD.startLine))
                  setEndLine(String(SAMPLE_CITATION_BUILD.endLine))
                  setCode(SAMPLE_CITATION_BUILD.code)
                }}
              >
                Load sample
              </Button>
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="citation-code">Code snippet (optional)</FieldLabel>
            <FieldContent>
              <Textarea
                id="citation-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={6}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="// ... existing code ..."
              />
            </FieldContent>
          </Field>
          {builtBlock && (
            <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
              {builtBlock}
            </pre>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-fit"
            disabled={!builtBlock}
            onClick={() => void copyText("Copied citation block.", builtBlock)}
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
            Copy citation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan input</CardTitle>
          <CardDescription>
            Paste <code className="text-xs">rg -n</code> output or existing
            citation fences to list and re-export blocks.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="citation-scan">Ripgrep or citations</FieldLabel>
            <FieldContent>
              <Textarea
                id="citation-scan"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
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
              onClick={() => setScanInput(SAMPLE_CITATION_SCAN)}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setScanInput("")}
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
              disabled={scanResult.citations.length === 0}
              onClick={() =>
                void copyText(
                  "Copied markdown summary.",
                  formatCitationScanMarkdown(scanResult),
                )
              }
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
              disabled={scanResult.citations.length === 0}
              onClick={() =>
                void copyText(
                  "Copied citation blocks.",
                  formatCitationScanBlocks(scanResult),
                )
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy all citations
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parsed citations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {scanResult.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {scanResult.warnings.map((warning) => (
                <p
                  key={warning}
                  className="text-muted-foreground text-sm leading-relaxed"
                >
                  {warning}
                </p>
              ))}
            </div>
          )}

          {scanResult.citations.length > 0 && (
            <>
              <StatRow
                label="Citations found"
                value={scanResult.citations.length}
              />
              <Separator />
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Lines</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanResult.citations.map((c) => (
                      <TableRow
                        key={`${c.filepath}:${c.startLine}:${c.endLine}:${c.sourceLine ?? 0}`}
                      >
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs sm:max-w-xs">
                          {c.filepath}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums whitespace-nowrap">
                          {c.startLine === c.endLine
                            ? c.startLine
                            : `${c.startLine}–${c.endLine}`}
                        </TableCell>
                        <TableCell className="max-w-[14rem] truncate font-mono text-xs text-muted-foreground">
                          {c.code ? (
                            c.code.slice(0, 80)
                          ) : (
                            <Badge variant="outline">no snippet</Badge>
                          )}
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
