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
import {
  SAMPLE_OUTDATED_JSON,
  SAMPLE_OUTDATED_TABLE,
} from "@/lib/outdated/defaults"
import {
  formatOutdatedMarkdown,
  formatOutdatedUpdateCommand,
  parseOutdatedScan,
} from "@/lib/outdated/parse"
import type { OutdatedBump, OutdatedPackage } from "@/lib/outdated/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  PackageIcon,
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

function bumpBadgeVariant(
  bump: OutdatedBump
): "default" | "secondary" | "destructive" | "outline" {
  switch (bump) {
    case "major":
      return "destructive"
    case "minor":
      return "default"
    case "patch":
    case "prerelease":
      return "secondary"
    default:
      return "outline"
  }
}

function PackageRow({ pkg }: { pkg: OutdatedPackage }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{pkg.name}</TableCell>
      <TableCell className="font-mono text-xs">{pkg.current}</TableCell>
      <TableCell className="font-mono text-xs">{pkg.latest}</TableCell>
      <TableCell>
        {pkg.depType === "devDependencies" ? (
          <Badge variant="outline">dev</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={bumpBadgeVariant(pkg.bump)}>
          {pkg.bump === "none" ? "unknown" : pkg.bump}
        </Badge>
      </TableCell>
    </TableRow>
  )
}

export function OutdatedApp() {
  const [input, setInput] = React.useState(SAMPLE_OUTDATED_TABLE)
  const [safeOnly, setSafeOnly] = React.useState(true)
  const [devOnly, setDevOnly] = React.useState(false)

  const result = React.useMemo(() => parseOutdatedScan(input), [input])

  const filtered = React.useMemo(() => {
    return result.packages.filter((pkg) => {
      if (devOnly && pkg.depType !== "devDependencies") {
        return false
      }
      if (
        safeOnly &&
        pkg.bump !== "patch" &&
        pkg.bump !== "minor" &&
        pkg.bump !== "prerelease"
      ) {
        return false
      }
      return true
    })
  }, [result.packages, safeOnly, devOnly])

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

  const updateCmd = formatOutdatedUpdateCommand(result, { safeOnly, devOnly })

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={PackageIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Outdated packages lab
            </h1>
            <p className="text-sm text-muted-foreground">
              Paste pnpm outdated output to group patch, minor, and major bumps
              and copy safe update commands.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outdated input</CardTitle>
          <CardDescription>
            Run <code className="text-xs">pnpm outdated</code> or{" "}
            <code className="text-xs">pnpm outdated --format json</code> and
            paste the results.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="outdated-input">Command output</FieldLabel>
            <FieldContent>
              <Textarea
                id="outdated-input"
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
              onClick={() => setInput(SAMPLE_OUTDATED_TABLE)}
            >
              Load table sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_OUTDATED_JSON)}
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
                  formatOutdatedMarkdown(result)
                )
              }
              disabled={result.packages.length === 0}
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
                void copyText("Copied pnpm update command.", updateCmd)
              }
              disabled={!updateCmd}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy update cmd
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

          {result.packages.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Outdated" value={result.summary.total} />
                <StatRow
                  label="Safe (patch/minor)"
                  value={result.summary.safeCount}
                />
                <StatRow label="Major" value={result.summary.majorCount} />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="safe-only"
                    checked={safeOnly}
                    onCheckedChange={(checked) => setSafeOnly(checked === true)}
                  />
                  <Label htmlFor="safe-only" className="text-sm font-normal">
                    Safe bumps only
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dev-only"
                    checked={devOnly}
                    onCheckedChange={(checked) => setDevOnly(checked === true)}
                  />
                  <Label htmlFor="dev-only" className="text-sm font-normal">
                    Dev dependencies only
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Latest</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Bump</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((pkg) => (
                      <PackageRow key={pkg.name} pkg={pkg} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No packages match the current filters.
                </p>
              )}

              {updateCmd && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Suggested command
                  </p>
                  <code className="font-mono text-xs">{updateCmd}</code>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
