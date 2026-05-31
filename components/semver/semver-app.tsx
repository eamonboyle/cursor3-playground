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
  SAMPLE_COMPARE_LEFT,
  SAMPLE_COMPARE_RIGHT,
  SAMPLE_VERSION,
} from "@/lib/semver/defaults"
import {
  bumpSemver,
  compareSemver,
  formatSemverReport,
  parseSemver,
} from "@/lib/semver/parse"
import type { SemverBump, SemverIssue } from "@/lib/semver/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUp01Icon,
  Copy01Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons"

const EXAMPLES = [
  "0.0.1",
  "1.4.2",
  "2.0.0-beta.1",
  "v3.1.0+build.7",
] as const

const BUMP_OPTIONS: { value: SemverBump; label: string }[] = [
  { value: "patch", label: "Patch" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "prerelease", label: "Prerelease" },
]

function IssueBadge({ level }: { level: SemverIssue["level"] }) {
  const variant =
    level === "error"
      ? "destructive"
      : level === "warn"
        ? "secondary"
        : "outline"
  const label =
    level === "error" ? "Error" : level === "warn" ? "Warning" : "Note"
  return (
    <Badge variant={variant} className="w-fit text-[0.65rem] uppercase">
      {label}
    </Badge>
  )
}

function IssueRow({ issue }: { issue: SemverIssue }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
      <IssueBadge level={issue.level} />
      <span>{issue.message}</span>
    </li>
  )
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

function orderLabel(order: -1 | 0 | 1 | null): string {
  if (order === null) {
    return "—"
  }
  if (order === 0) {
    return "equal"
  }
  return order < 0 ? "older" : "newer"
}

export function SemverApp() {
  const [version, setVersion] = React.useState(SAMPLE_VERSION)
  const [compareLeft, setCompareLeft] = React.useState(SAMPLE_COMPARE_LEFT)
  const [compareRight, setCompareRight] = React.useState(SAMPLE_COMPARE_RIGHT)
  const [bumpKind, setBumpKind] = React.useState<SemverBump>("patch")

  const parsed = React.useMemo(() => parseSemver(version), [version])
  const compare = React.useMemo(
    () => compareSemver(compareLeft, compareRight),
    [compareLeft, compareRight],
  )
  const bump = React.useMemo(
    () => bumpSemver(version, bumpKind),
    [version, bumpKind],
  )

  async function copyText(text: string, label: string) {
    if (!text.trim()) {
      toast.error(`Nothing to copy for ${label}.`)
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${label}.`)
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  async function copyReport() {
    const report = formatSemverReport(parsed, compare, bump)
    await copyText(report, "semver report")
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 p-6">
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
              Semver lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Validate versions, compare releases, and preview next bumps for
              changelogs and package.json.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version</CardTitle>
          <CardDescription>
            Semver 2.0 — optional <code className="text-xs">-prerelease</code>{" "}
            and <code className="text-xs">+build</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="semver-version">Version string</FieldLabel>
            <FieldContent>
              <Input
                id="semver-version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.4.2"
                className="font-mono"
                spellCheck={false}
                autoComplete="off"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((sample) => (
              <Button
                key={sample}
                type="button"
                variant="outline"
                size="sm"
                className="font-mono text-xs"
                onClick={() => setVersion(sample)}
              >
                {sample}
              </Button>
            ))}
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Validation</span>
              <Badge variant={parsed.valid ? "default" : "destructive"}>
                {parsed.valid ? "Valid" : "Invalid"}
              </Badge>
            </div>
            {parsed.parts ? (
              <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                <StatRow label="Normalized" value={parsed.normalized} />
                <StatRow
                  label="Core"
                  value={`${parsed.parts.major}.${parsed.parts.minor}.${parsed.parts.patch}`}
                />
                <StatRow
                  label="Prerelease"
                  value={
                    parsed.parts.prerelease.length
                      ? parsed.parts.prerelease.join(".")
                      : "—"
                  }
                />
                <StatRow
                  label="Build"
                  value={
                    parsed.parts.build.length
                      ? parsed.parts.build.join(".")
                      : "—"
                  }
                />
              </div>
            ) : null}
            {parsed.issues.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {parsed.issues.map((issue, index) => (
                  <IssueRow key={`${issue.message}-${index}`} issue={issue} />
                ))}
              </ul>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare</CardTitle>
          <CardDescription>
            Prerelease ordering follows semver 2.0; build metadata is ignored.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="semver-left">Left</FieldLabel>
              <FieldContent>
                <Input
                  id="semver-left"
                  value={compareLeft}
                  onChange={(e) => setCompareLeft(e.target.value)}
                  className="font-mono"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="semver-right">Right</FieldLabel>
              <FieldContent>
                <Input
                  id="semver-right"
                  value={compareRight}
                  onChange={(e) => setCompareRight(e.target.value)}
                  className="font-mono"
                  spellCheck={false}
                />
              </FieldContent>
            </Field>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Left vs right</span>
            <span className="font-mono font-medium capitalize">
              {compare.valid
                ? `${orderLabel(compare.order)} (${compare.left} · ${compare.right})`
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bump preview</CardTitle>
          <CardDescription>
            Suggested next version for release tags and{" "}
            <code className="text-xs">package.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {BUMP_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={bumpKind === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setBumpKind(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-muted-foreground">{bump.from || "—"}</span>
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              strokeWidth={2}
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="font-medium">{bump.valid ? bump.to : "—"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => copyText(bump.valid ? bump.to : "", "next version")}
          disabled={!bump.valid}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
          Copy bump
        </Button>
        <Button type="button" variant="outline" onClick={() => copyReport()}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
          Copy report
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Useful when drafting releases, checking whether{" "}
        <code className="text-foreground/90">^1.2.0</code> ranges resolve, or
        sanity-checking agent-suggested version bumps.
      </p>
    </div>
  )
}
