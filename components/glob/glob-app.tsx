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
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_GLOB_PATTERNS, SAMPLE_REPO_PATHS } from "@/lib/glob/defaults"
import {
  filterPathsByGlobs,
  formatGlobScopeMarkdown,
} from "@/lib/glob/filter"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  FilterIcon,
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

function PathList({
  paths,
  emptyLabel,
}: {
  paths: string[]
  emptyLabel: string
}) {
  if (paths.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{emptyLabel}</p>
    )
  }
  return (
    <ul className="max-h-48 space-y-1 overflow-y-auto font-mono text-[0.75rem]">
      {paths.map((path) => (
        <li
          key={path}
          className="rounded-md border border-border/50 bg-muted/20 px-2 py-1"
        >
          {path}
        </li>
      ))}
    </ul>
  )
}

export function GlobApp() {
  const [pathsText, setPathsText] = React.useState(SAMPLE_REPO_PATHS)
  const [patternsText, setPatternsText] = React.useState(SAMPLE_GLOB_PATTERNS)

  const result = React.useMemo(
    () => filterPathsByGlobs(pathsText, patternsText),
    [pathsText, patternsText],
  )

  const includedPaths = result.included.map((r) => r.path)
  const excludedPaths = result.excluded.map((r) => r.path)

  async function copySummary() {
    if (result.paths.length === 0) {
      toast.error("Add paths to copy a summary.")
      return
    }
    try {
      await navigator.clipboard.writeText(formatGlobScopeMarkdown(result))
      toast.success("Copied markdown summary.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  function loadSample() {
    setPathsText(SAMPLE_REPO_PATHS)
    setPatternsText(SAMPLE_GLOB_PATTERNS)
    toast.success("Loaded sample paths and patterns.")
  }

  function clearAll() {
    setPathsText("")
    setPatternsText("")
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={FilterIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Glob scope lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste repo paths and glob patterns to preview agent or test scope—
              supports <code className="text-xs">**</code>,{" "}
              <code className="text-xs">!</code> excludes, and{" "}
              <code className="text-xs">#</code> comments.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={loadSample}>
          Load sample
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearAll}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
          Clear
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void copySummary()}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
          Copy summary
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repo paths</CardTitle>
          <CardDescription>
            One path per line (e.g. from{" "}
            <code className="text-xs">git ls-files</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel className="sr-only">Paths</FieldLabel>
            <FieldContent>
              <Textarea
                value={pathsText}
                onChange={(e) => setPathsText(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder="lib/foo.ts&#10;components/bar.tsx"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Glob patterns</CardTitle>
          <CardDescription>
            One pattern per line. Prefix with{" "}
            <code className="text-xs">!</code> to exclude matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel className="sr-only">Patterns</FieldLabel>
            <FieldContent>
              <Textarea
                value={patternsText}
                onChange={(e) => setPatternsText(e.target.value)}
                rows={8}
                className="font-mono text-xs"
                placeholder="lib/**/*.ts&#10;!**/*.test.ts"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scope preview</CardTitle>
          <CardDescription>
            Included paths match at least one include pattern and no exclude.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{result.included.length} included</Badge>
            <Badge variant="secondary">{result.excluded.length} filtered</Badge>
            <Badge variant="outline">{result.unmatched.length} unmatched</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatRow label="Total paths" value={result.paths.length} />
            <StatRow label="Active patterns" value={result.patterns.length} />
          </div>

          {result.warnings.length > 0 ? (
            <ul className="text-muted-foreground space-y-1 text-sm">
              {result.warnings.map((w) => (
                <li key={w}>· {w}</li>
              ))}
            </ul>
          ) : null}

          <Separator />

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Included</h3>
              <PathList paths={includedPaths} emptyLabel="No paths in scope." />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Filtered out</h3>
              <PathList
                paths={excludedPaths}
                emptyLabel="No paths removed by rules."
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Unmatched</h3>
              <PathList
                paths={result.unmatched}
                emptyLabel="Every path matched a pattern."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
