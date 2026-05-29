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
  computeRelativeImport,
  formatImportPathMarkdown,
} from "@/lib/import-path/compute"
import { defaultImportPathPersisted } from "@/lib/import-path/defaults"
import {
  loadImportPathPersisted,
  saveImportPathPersisted,
} from "@/lib/import-path/storage"
import type { ImportPathPersisted } from "@/lib/import-path/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Link04Icon } from "@hugeicons/core-free-icons"

const EXAMPLES: { label: string; from: string; to: string }[] = [
  {
    label: "Branch app → slug helper",
    from: "components/branch/branch-app.tsx",
    to: "lib/branch/slug.ts",
  },
  {
    label: "Page → lib util",
    from: "app/import/page.tsx",
    to: "lib/utils.ts",
  },
  {
    label: "Deep component → UI button",
    from: "components/finance/budget-bar-chart.tsx",
    to: "components/ui/button.tsx",
  },
]

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

export function ImportPathApp() {
  const [persist, setPersist] = React.useState<ImportPathPersisted>(() =>
    defaultImportPathPersisted(),
  )
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    React.startTransition(() => {
      setPersist(loadImportPathPersisted())
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveImportPathPersisted(persist)
  }, [persist])

  const result = React.useMemo(
    () =>
      computeRelativeImport(persist.fromFile, persist.toFile, {
        stripExtension: persist.stripExtension,
        useAlias: persist.useAlias,
      }),
    [persist],
  )

  const copy = React.useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${label}`)
    } catch {
      toast.error("Clipboard unavailable")
    }
  }, [])

  const markdown = formatImportPathMarkdown(
    persist.fromFile,
    persist.toFile,
    result,
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            client
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            refactor helper
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Import path lab
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          When you move or split files, paste the source and target paths to get
          the relative import string — plus an{" "}
          <code className="text-foreground/90">@/</code> alias when it applies.
          Handy for agent refactors and manual import fixes.
        </p>
        <p className="text-muted-foreground text-xs">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← All demos
          </Link>
        </p>
      </header>

      <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon
              icon={Link04Icon}
              strokeWidth={2}
              className="text-primary size-5"
            />
            Paths
          </CardTitle>
          <CardDescription>
            Repo-relative paths (as in git). Forward slashes work best.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>From file (contains the import)</FieldLabel>
            <FieldContent>
              <Input
                value={persist.fromFile}
                onChange={(e) =>
                  setPersist((p) => ({ ...p, fromFile: e.target.value }))
                }
                placeholder="components/foo/bar.tsx"
                className="font-mono text-sm"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>To file (module being imported)</FieldLabel>
            <FieldContent>
              <Input
                value={persist.toFile}
                onChange={(e) =>
                  setPersist((p) => ({ ...p, toFile: e.target.value }))
                }
                placeholder="lib/utils.ts"
                className="font-mono text-sm"
                spellCheck={false}
              />
            </FieldContent>
          </Field>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Button
                key={ex.label}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  setPersist((p) => ({
                    ...p,
                    fromFile: ex.from,
                    toFile: ex.to,
                  }))
                }
              >
                {ex.label}
              </Button>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="strip-ext"
                checked={persist.stripExtension}
                onCheckedChange={(stripExtension) =>
                  setPersist((p) => ({ ...p, stripExtension }))
                }
              />
              <label htmlFor="strip-ext" className="text-sm">
                Strip .ts / .tsx extension
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="use-alias"
                checked={persist.useAlias}
                onCheckedChange={(useAlias) =>
                  setPersist((p) => ({ ...p, useAlias }))
                }
              />
              <label htmlFor="use-alias" className="text-sm">
                Show @/ alias path
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Result</CardTitle>
          <CardDescription>
            {ready ? "Updates as you type." : "Loading saved preferences…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow label="From directory" value={result.fromDir} />

          {result.importPath ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Relative import
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <code className="flex-1 truncate font-mono text-sm">
                  {`import { … } from "${result.importPath}"`}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    copy(`import { } from "${result.importPath}"`, "relative import")
                  }
                  aria-label="Copy relative import"
                >
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </Button>
              </div>
            </div>
          ) : null}

          {result.aliasPath ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Alias import (@/*)
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <code className="flex-1 truncate font-mono text-sm">
                  {`import { … } from "${result.aliasPath}"`}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    copy(`import { } from "${result.aliasPath}"`, "alias import")
                  }
                  aria-label="Copy alias import"
                >
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </Button>
              </div>
            </div>
          ) : null}

          {result.warnings.length > 0 ? (
            <ul className="text-muted-foreground list-inside list-disc text-sm">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!result.importPath}
            onClick={() => copy(markdown, "markdown summary")}
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="mr-1.5 size-3.5"
            />
            Copy markdown summary
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
