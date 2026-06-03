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
import { Textarea } from "@/components/ui/textarea"
import {
  SAMPLE_SEMVER_LEFT,
  SAMPLE_SEMVER_LIST,
  SAMPLE_SEMVER_RANGE,
  SAMPLE_SEMVER_RIGHT,
  SAMPLE_SEMVER_VERSION,
} from "@/lib/semver/defaults"
import {
  checkSemverRange,
  compareSemverStrings,
  formatSemverCompareMarkdown,
  sortSemverLines,
} from "@/lib/semver/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, PackageIcon } from "@hugeicons/core-free-icons"

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

const ORDER_LABEL = {
  [-1]: "left is older",
  0: "versions are equal",
  1: "left is newer",
} as const

export function SemverApp() {
  const [left, setLeft] = React.useState(SAMPLE_SEMVER_LEFT)
  const [right, setRight] = React.useState(SAMPLE_SEMVER_RIGHT)
  const [version, setVersion] = React.useState(SAMPLE_SEMVER_VERSION)
  const [range, setRange] = React.useState(SAMPLE_SEMVER_RANGE)
  const [list, setList] = React.useState(SAMPLE_SEMVER_LIST)

  const compare = React.useMemo(
    () => compareSemverStrings(left, right),
    [left, right],
  )
  const rangeCheck = React.useMemo(
    () => checkSemverRange(version, range),
    [version, range],
  )
  const sorted = React.useMemo(() => sortSemverLines(list), [list])

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
            icon={PackageIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Semver lab</h1>
            <p className="text-muted-foreground text-sm">
              Compare versions, check npm-style ranges (^, ~, &gt;=), and sort
              dependency lists — no network calls.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare two versions</CardTitle>
          <CardDescription>
            Strict semver 2.0 parsing with prerelease ordering and bump hints.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Left</FieldLabel>
              <FieldContent>
                <Input
                  value={left}
                  onChange={(e) => setLeft(e.target.value)}
                  placeholder="1.4.2"
                  className="font-mono"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Right</FieldLabel>
              <FieldContent>
                <Input
                  value={right}
                  onChange={(e) => setRight(e.target.value)}
                  placeholder="2.0.0-beta.1"
                  className="font-mono"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
          </div>

          {compare.warnings.length > 0 && (
            <ul className="text-muted-foreground list-inside list-disc text-sm">
              {compare.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {compare.left.valid && compare.right.valid && (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
              <StatRow
                label="Order"
                value={ORDER_LABEL[compare.order]}
              />
              <StatRow label="Bump" value={compare.bump} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={compare.order < 0 ? "default" : "outline"}>
                  {compare.left.raw}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {compare.order === 0 ? "=" : compare.order < 0 ? "<" : ">"}
                </span>
                <Badge variant={compare.order > 0 ? "default" : "outline"}>
                  {compare.right.raw}
                </Badge>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              copyText(
                "Copied compare summary.",
                formatSemverCompareMarkdown(compare),
              )
            }
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
            Copy markdown summary
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Range check</CardTitle>
          <CardDescription>
            Does a version satisfy ^, ~, &gt;=, &gt;, &lt;=, &lt;, or an exact
            range?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Version</FieldLabel>
              <FieldContent>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.5.3"
                  className="font-mono"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Range</FieldLabel>
              <FieldContent>
                <Input
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="^1.4.0"
                  className="font-mono"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
          </div>

          {rangeCheck.version.valid && rangeCheck.rangeKind && (
            <div className="flex items-center gap-2">
              <Badge
                variant={rangeCheck.satisfies ? "default" : "destructive"}
              >
                {rangeCheck.satisfies ? "satisfies" : "does not satisfy"}
              </Badge>
              <span className="text-muted-foreground font-mono text-sm">
                {rangeCheck.version.raw} vs {rangeCheck.range}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sort a list</CardTitle>
          <CardDescription>
            One version per line; optional v prefix and # comments are ignored.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Versions</FieldLabel>
            <FieldContent>
              <Textarea
                value={list}
                onChange={(e) => setList(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                spellCheck={false}
              />
            </FieldContent>
          </Field>

          {sorted.warnings.length > 0 && (
            <ul className="text-muted-foreground list-inside list-disc text-sm">
              {sorted.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {sorted.sorted.length > 0 && (
            <>
              <Separator />
              <pre className="bg-muted/40 overflow-x-auto rounded-lg p-3 font-mono text-sm">
                {sorted.sorted.join("\n")}
              </pre>
              {sorted.invalid.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  Skipped invalid: {sorted.invalid.join(", ")}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  copyText("Copied sorted versions.", sorted.sorted.join("\n"))
                }
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Copy sorted list
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
