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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { defaultBranchPersisted } from "@/lib/branch/defaults"
import { buildBranchName } from "@/lib/branch/slug"
import { loadBranchPersisted, saveBranchPersisted } from "@/lib/branch/storage"
import type { BranchPersisted, BranchPrefix } from "@/lib/branch/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, GitBranchIcon } from "@hugeicons/core-free-icons"

const EXAMPLES = [
  "Add branch name lab for git-safe slugs",
  "Fix RSVP chart tooltip on mobile",
  "cursor-testing-feature-1131",
  "Refactor: extract cron field parser",
] as const

const PREFIX_LABELS: Record<BranchPrefix, string> = {
  "": "(none)",
  feat: "feat/",
  fix: "fix/",
  chore: "chore/",
  cursor: "cursor/",
}

/** Radix Select reserves "" for clearing; map no-prefix to a sentinel in the UI. */
const NO_PREFIX_SELECT_VALUE = "none"

function prefixToSelectValue(prefix: BranchPrefix) {
  return prefix || NO_PREFIX_SELECT_VALUE
}

function selectValueToPrefix(value: string): BranchPrefix {
  return value === NO_PREFIX_SELECT_VALUE ? "" : (value as BranchPrefix)
}

export function BranchApp() {
  const [persist, setPersist] = React.useState<BranchPersisted>(() =>
    defaultBranchPersisted(),
  )
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    React.startTransition(() => {
      setPersist(loadBranchPersisted())
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveBranchPersisted(persist)
  }, [persist])

  const result = React.useMemo(
    () =>
      buildBranchName(persist.title, {
        prefix: persist.prefix,
        maxLength: persist.maxLength,
      }),
    [persist.title, persist.prefix, persist.maxLength],
  )

  async function copyBranch() {
    if (!result.branch) {
      toast.error("Enter a valid title first.")
      return
    }
    try {
      await navigator.clipboard.writeText(result.branch)
      toast.success("Copied branch name.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  function setPrefix(prefix: BranchPrefix) {
    setPersist((p) => ({ ...p, prefix }))
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={GitBranchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Branch name lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Turn feature titles into git-safe branch names with optional
              prefixes.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature title</CardTitle>
          <CardDescription>
            Paste a ticket title, PR summary, or agent task—preview updates live.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="branch-title">Title</FieldLabel>
            <FieldContent>
              <Textarea
                id="branch-title"
                rows={4}
                value={persist.title}
                onChange={(e) =>
                  setPersist((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Add branch name lab for contributors"
                className="font-mono text-sm"
              />
            </FieldContent>
          </Field>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <Button
                key={example}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto max-w-full py-1.5 text-left text-xs font-normal"
                onClick={() => setPersist((p) => ({ ...p, title: example }))}
              >
                {example}
              </Button>
            ))}
          </div>

          <Field>
            <FieldLabel>Prefix</FieldLabel>
            <FieldContent>
              <Select
                value={prefixToSelectValue(persist.prefix)}
                onValueChange={(v) => setPrefix(selectValueToPrefix(v))}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PREFIX_LABELS) as BranchPrefix[]).map(
                    (key) => (
                      <SelectItem
                        key={key || NO_PREFIX_SELECT_VALUE}
                        value={prefixToSelectValue(key)}
                      >
                        {PREFIX_LABELS[key]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>
              Max length{" "}
              <span className="font-mono text-muted-foreground">
                {persist.maxLength}
              </span>
            </FieldLabel>
            <FieldContent>
              <Slider
                min={20}
                max={80}
                step={1}
                value={[persist.maxLength]}
                onValueChange={([v]) =>
                  setPersist((p) => ({
                    ...p,
                    maxLength: v ?? p.maxLength,
                  }))
                }
              />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>
              Slug segment:{" "}
              <span className="font-mono text-foreground/80">
                {result.slug || "—"}
              </span>
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!result.branch}
            onClick={() => void copyBranch()}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
            Copy
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p
            className="rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm break-all"
            aria-live="polite"
          >
            {ready ? result.branch || "—" : "…"}
          </p>
          {result.warnings.length > 0 && (
            <ul className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <li key={warning}>
                  <Badge variant="outline" className="font-normal">
                    {warning}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />

      <p className="text-muted-foreground text-xs leading-relaxed">
        Matches common Cloud Agent branches like{" "}
        <code className="text-foreground/90">cursor/feature-slug</code>. Does
        not check remote for duplicates—copy and create locally with{" "}
        <code className="text-foreground/90">git checkout -b</code>.
      </p>
    </div>
  )
}
