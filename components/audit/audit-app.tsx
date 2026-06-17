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
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
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
import { SAMPLE_AUDIT_JSON, SAMPLE_AUDIT_TABLE } from "@/lib/audit/defaults"
import {
  formatAuditFixCommand,
  formatAuditMarkdown,
  formatAuditPackageNames,
  formatAuditPaths,
  parseAuditScan,
} from "@/lib/audit/parse"
import type { AuditFinding, AuditSeverity } from "@/lib/audit/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Shield01Icon,
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

function severityBadgeVariant(
  severity: AuditSeverity
): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "critical":
    case "high":
      return "destructive"
    case "moderate":
      return "default"
    case "low":
      return "secondary"
    case "info":
      return "outline"
    default: {
      const _exhaustive: never = severity
      return _exhaustive
    }
  }
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant={severityBadgeVariant(finding.severity)}>
          {finding.severity}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">{finding.packageName}</TableCell>
      <TableCell className="max-w-[14rem] truncate text-xs">
        {finding.title}
      </TableCell>
      <TableCell className="font-mono text-xs">
        {finding.patchedVersions || "—"}
      </TableCell>
      <TableCell className="max-w-[12rem] truncate font-mono text-xs">
        {finding.paths[0] ?? "—"}
      </TableCell>
    </TableRow>
  )
}

const SEVERITY_OPTIONS: AuditSeverity[] = [
  "critical",
  "high",
  "moderate",
  "low",
  "info",
]

export function AuditApp() {
  const [input, setInput] = React.useState(SAMPLE_AUDIT_TABLE)
  const [hiddenSeverities, setHiddenSeverities] = React.useState<
    Set<AuditSeverity>
  >(new Set(["info", "low"]))

  const result = React.useMemo(() => parseAuditScan(input), [input])

  const filtered = React.useMemo(() => {
    return result.findings.filter(
      (finding) => !hiddenSeverities.has(finding.severity)
    )
  }, [result.findings, hiddenSeverities])

  function toggleSeverity(severity: AuditSeverity, checked: boolean) {
    setHiddenSeverities((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.delete(severity)
      } else {
        next.add(severity)
      }
      return next
    })
  }

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

  const fixCmd = formatAuditFixCommand(result)

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Shield01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Audit lab
            </h1>
            <p className="text-sm text-muted-foreground">
              Paste pnpm audit output to group vulnerabilities by severity and
              copy package names, dependency paths, or fix commands.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit input</CardTitle>
          <CardDescription>
            Run <code className="text-xs">pnpm audit</code> or{" "}
            <code className="text-xs">pnpm audit --json</code> and paste the
            results.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="audit-input">Command output</FieldLabel>
            <FieldContent>
              <Textarea
                id="audit-input"
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
              onClick={() => setInput(SAMPLE_AUDIT_TABLE)}
            >
              Load table sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_AUDIT_JSON)}
            >
              Load JSON sample
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
                  formatAuditMarkdown(result)
                )
              }
              disabled={result.findings.length === 0}
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
                  "Copied package names.",
                  formatAuditPackageNames(result)
                )
              }
              disabled={result.findings.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy packages
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText("Copied dependency paths.", formatAuditPaths(result))
              }
              disabled={result.findings.length === 0}
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
                void copyText("Copied pnpm audit --fix.", fixCmd)
              }
              disabled={!fixCmd}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy fix cmd
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
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {warning}
                </p>
              ))}
            </div>
          )}

          {result.findings.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Vulnerabilities" value={result.summary.total} />
                {SEVERITY_OPTIONS.map((severity) =>
                  result.summary.bySeverity[severity] > 0 ? (
                    <StatRow
                      key={severity}
                      label={severity}
                      value={result.summary.bySeverity[severity]}
                    />
                  ) : null
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {SEVERITY_OPTIONS.map((severity) => (
                  <div key={severity} className="flex items-center gap-2">
                    <Checkbox
                      id={`sev-${severity}`}
                      checked={!hiddenSeverities.has(severity)}
                      onCheckedChange={(checked) =>
                        toggleSeverity(severity, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`sev-${severity}`}
                      className="text-sm font-normal capitalize"
                    >
                      {severity}
                    </Label>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Patched</TableHead>
                      <TableHead>Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((finding) => (
                      <FindingRow
                        key={`${finding.packageName}-${finding.sourceLine}-${finding.title}`}
                        finding={finding}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No findings match the current severity filters.
                </p>
              )}

              {fixCmd && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Suggested command
                  </p>
                  <code className="font-mono text-xs">{fixCmd}</code>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
