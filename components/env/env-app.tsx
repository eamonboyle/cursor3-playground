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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  diffEnvFiles,
  formatEnvDiffMarkdown,
  maskEnvValue,
} from "@/lib/env/diff"
import {
  SAMPLE_ENV_LOCAL,
  SAMPLE_ENV_REFERENCE,
} from "@/lib/env/defaults"
import { loadEnvPersisted, saveEnvPersisted } from "@/lib/env/storage"
import type { EnvPersisted } from "@/lib/env/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Key01Icon,
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

function KeyList({
  keys,
  emptyLabel,
}: {
  keys: string[]
  emptyLabel: string
}) {
  if (keys.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>
  }
  return (
    <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-[0.75rem]">
      {keys.map((key) => (
        <li
          key={key}
          className="rounded-md border border-border/50 bg-muted/20 px-2 py-1"
        >
          {key}
        </li>
      ))}
    </ul>
  )
}

export function EnvApp() {
  const [persist, setPersist] = React.useState<EnvPersisted>(() => ({
    referenceText: SAMPLE_ENV_REFERENCE,
    localText: SAMPLE_ENV_LOCAL,
    revealValues: false,
  }))
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    React.startTransition(() => {
      setPersist(loadEnvPersisted())
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveEnvPersisted(persist)
  }, [persist])

  const result = React.useMemo(
    () => diffEnvFiles(persist.referenceText, persist.localText),
    [persist.referenceText, persist.localText],
  )

  const inSync =
    result.onlyInReference.length === 0 &&
    result.onlyInLocal.length === 0 &&
    result.conflicting.length === 0 &&
    result.reference.byKey.size > 0 &&
    result.local.byKey.size > 0

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(
        formatEnvDiffMarkdown(result, { revealValues: persist.revealValues }),
      )
      toast.success("Copied diff report.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  function loadSample() {
    setPersist((prev) => ({
      ...prev,
      referenceText: SAMPLE_ENV_REFERENCE,
      localText: SAMPLE_ENV_LOCAL,
    }))
    toast.message("Loaded sample env files.")
  }

  function clearAll() {
    setPersist((prev) => ({
      ...prev,
      referenceText: "",
      localText: "",
    }))
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Key01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Env key diff
            </h1>
            <p className="text-muted-foreground text-sm">
              Compare .env.example against a local .env — spot missing keys,
              extras, and value mismatches before you run or deploy.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant={inSync ? "default" : "secondary"}>
            {inSync ? "Keys in sync" : "Diff found"}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Env files</CardTitle>
          <CardDescription>
            Paste reference keys (e.g. .env.example) on the left and your local
            file on the right. Values are masked unless you reveal them.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="env-reference">Reference</FieldLabel>
              <FieldContent>
                <Textarea
                  id="env-reference"
                  value={persist.referenceText}
                  onChange={(e) =>
                    setPersist((prev) => ({
                      ...prev,
                      referenceText: e.target.value,
                    }))
                  }
                  rows={14}
                  className="font-mono text-[0.75rem] leading-relaxed"
                  spellCheck={false}
                  disabled={!ready}
                  placeholder="NEXT_PUBLIC_APP_URL=http://localhost:3000"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="env-local">Local</FieldLabel>
              <FieldContent>
                <Textarea
                  id="env-local"
                  value={persist.localText}
                  onChange={(e) =>
                    setPersist((prev) => ({
                      ...prev,
                      localText: e.target.value,
                    }))
                  }
                  rows={14}
                  className="font-mono text-[0.75rem] leading-relaxed"
                  spellCheck={false}
                  disabled={!ready}
                  placeholder="NEXT_PUBLIC_APP_URL=http://localhost:3000"
                />
              </FieldContent>
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="env-reveal"
                checked={persist.revealValues}
                onCheckedChange={(checked) =>
                  setPersist((prev) => ({ ...prev, revealValues: checked }))
                }
                disabled={!ready}
              />
              <FieldLabel htmlFor="env-reveal" className="mb-0 cursor-pointer">
                Reveal values in UI and copy
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadSample}
              >
                Load sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={!persist.referenceText && !persist.localText}
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
                onClick={() => void copyReport()}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow
            label="Reference keys"
            value={result.reference.byKey.size}
          />
          <StatRow label="Local keys" value={result.local.byKey.size} />
          <StatRow label="Matching values" value={result.matching.length} />
          <StatRow
            label="Missing locally"
            value={result.onlyInReference.length}
          />
          <StatRow label="Extra locally" value={result.onlyInLocal.length} />
          <StatRow
            label="Value mismatches"
            value={result.conflicting.length}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing locally</CardTitle>
            <CardDescription>Keys in reference but not in local</CardDescription>
          </CardHeader>
          <CardContent>
            <KeyList
              keys={result.onlyInReference}
              emptyLabel="None — local has every reference key."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extra locally</CardTitle>
            <CardDescription>Keys in local but not in reference</CardDescription>
          </CardHeader>
          <CardContent>
            <KeyList
              keys={result.onlyInLocal}
              emptyLabel="None — no undocumented local keys."
            />
          </CardContent>
        </Card>
      </div>

      {result.conflicting.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value mismatches</CardTitle>
            <CardDescription>
              Same key, different value on each side
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {result.conflicting.map((row) => (
                <li
                  key={row.key}
                  className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-[0.75rem]"
                >
                  <span className="font-semibold">{row.key}</span>
                  <Separator className="my-2" />
                  <div className="text-muted-foreground grid gap-1 sm:grid-cols-2">
                    <span>
                      ref:{" "}
                      {persist.revealValues
                        ? row.referenceValue
                        : maskEnvValue(row.referenceValue)}
                    </span>
                    <span>
                      local:{" "}
                      {persist.revealValues
                        ? row.localValue
                        : maskEnvValue(row.localValue)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {result.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warnings</CardTitle>
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
    </div>
  )
}
