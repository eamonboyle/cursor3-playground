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
  SAMPLE_PACKAGE_BASE,
  SAMPLE_PACKAGE_HEAD,
} from "@/lib/deps/defaults"
import {
  diffPackageJson,
  formatDepsDiffMarkdown,
  formatDepsInstallHints,
} from "@/lib/deps/diff"
import { loadDepsPersisted, saveDepsPersisted } from "@/lib/deps/storage"
import type { DepEntry, DepSection, DepVersionChange } from "@/lib/deps/types"
import { DEP_SECTIONS } from "@/lib/deps/types"
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
  bump: DepVersionChange["bump"],
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

function DepRow({ entry, action }: { entry: DepEntry; action: string }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{entry.name}</TableCell>
      <TableCell className="text-xs">{entry.section}</TableCell>
      <TableCell className="font-mono text-xs">{entry.version}</TableCell>
      <TableCell>
        <Badge variant="outline">{action}</Badge>
      </TableCell>
    </TableRow>
  )
}

function ChangeRow({ row }: { row: DepVersionChange }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.name}</TableCell>
      <TableCell className="text-xs">{row.section}</TableCell>
      <TableCell className="font-mono text-xs">{row.baseVersion}</TableCell>
      <TableCell className="font-mono text-xs">{row.headVersion}</TableCell>
      <TableCell>
        <Badge variant={bumpBadgeVariant(row.bump)}>{row.bump}</Badge>
      </TableCell>
    </TableRow>
  )
}

const SECTION_LABELS: Record<DepSection, string> = {
  dependencies: "dependencies",
  devDependencies: "devDependencies",
  peerDependencies: "peerDependencies",
  optionalDependencies: "optionalDependencies",
}

export function DepsApp() {
  const [persist, setPersist] = React.useState(() => loadDepsPersisted())
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    React.startTransition(() => {
      setPersist(loadDepsPersisted())
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveDepsPersisted(persist)
  }, [persist])

  const result = React.useMemo(
    () =>
      diffPackageJson(persist.baseText, persist.headText, {
        sections: persist.sections,
      }),
    [persist.baseText, persist.headText, persist.sections],
  )

  function toggleSection(section: DepSection, checked: boolean) {
    setPersist((prev) => {
      const next = checked
        ? [...prev.sections, section]
        : prev.sections.filter((s) => s !== section)
      return {
        ...prev,
        sections: next.length > 0 ? next : [section],
      }
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

  if (!ready) {
    return null
  }

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
              Package dependency diff
            </h1>
            <p className="text-muted-foreground text-sm">
              Compare two <code className="text-xs">package.json</code> files —
              added, removed, and version bumps with semver hints and pnpm
              install commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="secondary">
            {result.changed.length} version change
            {result.changed.length === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">
            +{result.onlyInHead.length} / −{result.onlyInBase.length}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">package.json inputs</CardTitle>
          <CardDescription>
            Paste a base (e.g. main branch) and head (e.g. after{" "}
            <code className="text-xs">pnpm outdated</code>) snapshot. Partial
            JSON with only dependency sections works too.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="deps-base">Base</FieldLabel>
              <FieldContent>
                <Textarea
                  id="deps-base"
                  value={persist.baseText}
                  onChange={(e) =>
                    setPersist((p) => ({ ...p, baseText: e.target.value }))
                  }
                  rows={14}
                  className="font-mono text-[0.75rem] leading-relaxed"
                  spellCheck={false}
                  placeholder='{ "dependencies": { ... } }'
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="deps-head">Head</FieldLabel>
              <FieldContent>
                <Textarea
                  id="deps-head"
                  value={persist.headText}
                  onChange={(e) =>
                    setPersist((p) => ({ ...p, headText: e.target.value }))
                  }
                  rows={14}
                  className="font-mono text-[0.75rem] leading-relaxed"
                  spellCheck={false}
                  placeholder='{ "dependencies": { ... } }'
                />
              </FieldContent>
            </Field>
          </div>

          <div className="flex flex-wrap gap-4">
            {DEP_SECTIONS.map((section) => (
              <div key={section} className="flex items-center gap-2">
                <Checkbox
                  id={`deps-section-${section}`}
                  checked={persist.sections.includes(section)}
                  onCheckedChange={(checked) =>
                    toggleSection(section, checked === true)
                  }
                />
                <FieldLabel
                  htmlFor={`deps-section-${section}`}
                  className="mb-0 cursor-pointer font-mono text-xs"
                >
                  {SECTION_LABELS[section]}
                </FieldLabel>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPersist((p) => ({
                  ...p,
                  baseText: SAMPLE_PACKAGE_BASE,
                  headText: SAMPLE_PACKAGE_HEAD,
                }))
                toast.message("Loaded sample package.json pair.")
              }}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPersist((p) => ({ ...p, baseText: "", headText: "" }))
              }
              disabled={!persist.baseText && !persist.headText}
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
                  "Copied pnpm commands.",
                  formatDepsInstallHints(result),
                )
              }
              disabled={
                result.onlyInBase.length === 0 &&
                result.onlyInHead.length === 0 &&
                result.changed.length === 0
              }
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy pnpm hints
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied markdown report.",
                  formatDepsDiffMarkdown(result),
                )
              }
              disabled={result.base.byKey.size === 0 && result.head.byKey.size === 0}
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
          <StatRow label="Base packages" value={result.base.byKey.size} />
          <StatRow label="Head packages" value={result.head.byKey.size} />
          <StatRow label="Removed" value={result.onlyInBase.length} />
          <StatRow label="Added" value={result.onlyInHead.length} />
          <StatRow label="Version changes" value={result.changed.length} />
          <StatRow label="Unchanged" value={result.matching.length} />
        </CardContent>
      </Card>

      {result.changed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version changes</CardTitle>
            <CardDescription>
              Bump column uses semver on stripped range prefixes (^, ~).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead>Bump</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.changed.map((row) => (
                    <ChangeRow key={`${row.section}:${row.name}`} row={row} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result.onlyInHead.length > 0 || result.onlyInBase.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Added & removed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.onlyInHead.map((entry) => (
                    <DepRow
                      key={`add-${entry.section}:${entry.name}`}
                      entry={entry}
                      action="added"
                    />
                  ))}
                  {result.onlyInBase.map((entry) => (
                    <DepRow
                      key={`rm-${entry.section}:${entry.name}`}
                      entry={entry}
                      action="removed"
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
        Tip: run <code className="rounded bg-muted px-1">pnpm outdated</code>,
        update <code className="rounded bg-muted px-1">package.json</code>, then
        paste before/after here for a reviewable diff.
      </p>
    </div>
  )
}
