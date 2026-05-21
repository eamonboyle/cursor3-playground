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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_JSON } from "@/lib/json/defaults"
import { formatJson, minifyJson } from "@/lib/json/format"
import { parseJson } from "@/lib/json/parse"
import { analyzeJsonStructure } from "@/lib/json/stats"
import { loadJsonPersisted, saveJsonPersisted } from "@/lib/json/storage"
import type { JsonIndent, JsonPersisted } from "@/lib/json/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  CodeFolderIcon,
  Delete02Icon,
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

export function JsonApp() {
  const [persist, setPersist] = React.useState<JsonPersisted>(() => ({
    input: SAMPLE_JSON,
    indent: 2,
  }))
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    setPersist(loadJsonPersisted())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveJsonPersisted(persist)
  }, [persist])

  const parsed = React.useMemo(
    () => parseJson(persist.input),
    [persist.input],
  )

  const stats = React.useMemo(() => {
    if (!parsed.ok) {
      return null
    }
    const serialized = JSON.stringify(parsed.value)
    return analyzeJsonStructure(parsed.value, serialized)
  }, [parsed])

  function setInput(input: string) {
    setPersist((p) => ({ ...p, input }))
  }

  function setIndent(indent: JsonIndent) {
    setPersist((p) => ({ ...p, indent }))
  }

  const applyFormat = React.useCallback(() => {
    const result = formatJson(persist.input, persist.indent)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setInput(result.output)
    toast.success("Formatted JSON.")
  }, [persist.input, persist.indent])

  function applyMinify() {
    const result = minifyJson(persist.input)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setInput(result.output)
    toast.success("Minified JSON.")
  }

  function loadSample() {
    setInput(SAMPLE_JSON)
    toast.message("Loaded sample JSON.")
  }

  function clearInput() {
    setInput("")
  }

  async function copyInput() {
    if (!persist.input.trim()) {
      toast.error("Nothing to copy.")
      return
    }
    try {
      await navigator.clipboard.writeText(persist.input)
      toast.success("Copied JSON.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }
      const target = event.target
      if (
        !(target instanceof HTMLElement) ||
        target.tagName !== "TEXTAREA"
      ) {
        return
      }
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "f") {
        return
      }
      if (!event.shiftKey) {
        return
      }
      event.preventDefault()
      applyFormat()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [applyFormat])

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading JSON lab…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 p-6 pb-16">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={CodeFolderIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">JSON lab</h1>
            <p className="text-muted-foreground text-sm">
              Validate, pretty-print, and minify JSON with structure stats and
              error line hints.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            Paste API responses or config files. Use{" "}
            <kbd className="rounded border border-border/80 bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
              ⌘⇧F
            </kbd>{" "}
            or{" "}
            <kbd className="rounded border border-border/80 bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
              Ctrl⇧F
            </kbd>{" "}
            while focused here to format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field>
            <FieldLabel htmlFor="json-input">JSON</FieldLabel>
            <FieldContent>
              <Textarea
                id="json-input"
                value={persist.input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                className="min-h-[220px] font-mono text-[0.8rem] leading-relaxed"
                placeholder='{"hello": "world"}'
                aria-invalid={!parsed.ok && persist.input.trim().length > 0}
              />
            </FieldContent>
          </Field>

          <div className="flex flex-wrap items-end gap-3">
            <Field className="min-w-[8rem] flex-1">
              <FieldLabel>Indent</FieldLabel>
              <FieldContent>
                <Select
                  value={String(persist.indent)}
                  onValueChange={(v) => {
                    if (v === "2" || v === "4" || v === "tab") {
                      setIndent(v === "tab" ? "tab" : Number(v) as 2 | 4)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="tab">Tabs</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={applyFormat}>
                Format
              </Button>
              <Button type="button" variant="secondary" onClick={applyMinify}>
                Minify
              </Button>
              <Button type="button" variant="outline" onClick={loadSample}>
                Sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyInput}
                aria-label="Copy JSON"
              >
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearInput}
                aria-label="Clear JSON"
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
          <CardDescription>
            Live validation and tree metrics for the current buffer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Status</span>
            {parsed.ok ? (
              <Badge variant="default">Valid JSON</Badge>
            ) : persist.input.trim() ? (
              <Badge variant="destructive">Invalid</Badge>
            ) : (
              <Badge variant="outline">Empty</Badge>
            )}
          </div>

          {!parsed.ok && persist.input.trim() ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              role="alert"
            >
              <p className="font-mono text-[0.75rem] leading-relaxed break-all">
                {parsed.error}
              </p>
              {parsed.line !== undefined && parsed.column !== undefined ? (
                <p className="mt-2 text-[0.7rem] text-destructive/80">
                  Near line {parsed.line}, column {parsed.column}
                </p>
              ) : null}
            </div>
          ) : null}

          {parsed.ok && stats ? (
            <>
              <Separator />
              <div className="space-y-2.5">
                <StatRow label="Root type" value={stats.rootKind} />
                <StatRow label="Max depth" value={stats.maxDepth} />
                <StatRow label="Nodes" value={stats.nodeCount} />
                {stats.keyCount !== undefined ? (
                  <StatRow label="Object keys" value={stats.keyCount} />
                ) : null}
                {stats.arrayLength !== undefined ? (
                  <StatRow label="Array length" value={stats.arrayLength} />
                ) : null}
                {stats.stringChars !== undefined ? (
                  <StatRow label="String chars" value={stats.stringChars} />
                ) : null}
                <StatRow label="UTF-8 bytes" value={stats.byteLength} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
