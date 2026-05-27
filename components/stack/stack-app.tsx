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
import { SAMPLE_STACK_TRACE } from "@/lib/stack/defaults"
import {
  formatStackFramesMarkdown,
  formatStackFramesPaths,
  frameLocation,
  parseStackTrace,
} from "@/lib/stack/parse"
import { loadStackPersisted, saveStackPersisted } from "@/lib/stack/storage"
import type { StackFrame, StackPersisted } from "@/lib/stack/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Bug01Icon,
  Copy01Icon,
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

function FrameRow({
  frame,
  onCopy,
}: {
  frame: StackFrame
  onCopy: (text: string) => void
}) {
  const loc = frameLocation(frame)
  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <div className="min-w-0 flex-1 font-mono text-[0.75rem] leading-relaxed">
        <p className="truncate font-medium text-foreground">{loc}</p>
        {frame.symbol ? (
          <p className="text-muted-foreground truncate text-xs">{frame.symbol}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {frame.kind} · source line {frame.sourceLine}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onCopy(loc)}
        aria-label={`Copy ${loc}`}
      >
        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
      </Button>
    </li>
  )
}

export function StackApp() {
  const [persist, setPersist] = React.useState<StackPersisted>(() => ({
    text: SAMPLE_STACK_TRACE,
    hideNodeModules: true,
    hideInternals: true,
  }))
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    React.startTransition(() => {
      setPersist(loadStackPersisted())
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveStackPersisted(persist)
  }, [persist])

  const result = React.useMemo(
    () =>
      parseStackTrace(persist.text, {
        hideNodeModules: persist.hideNodeModules,
        hideInternals: persist.hideInternals,
      }),
    [persist.text, persist.hideNodeModules, persist.hideInternals],
  )

  async function copyText(text: string, label: string) {
    if (!text.trim()) {
      toast.error("Nothing to copy.")
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  function loadSample() {
    setPersist((prev) => ({ ...prev, text: SAMPLE_STACK_TRACE }))
    toast.message("Loaded sample stack trace.")
  }

  function clearText() {
    setPersist((prev) => ({ ...prev, text: "" }))
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Bug01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Stack trace lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste an error stack to extract file:line frames — filter
              node_modules and internals, then copy paths for Cursor or your
              editor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant={result.unique.length > 0 ? "default" : "secondary"}>
            {result.unique.length} unique frame
            {result.unique.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stack trace</CardTitle>
          <CardDescription>
            Supports V8 / Node, Next.js webpack-internal paths, Python File
            lines, and Rust source-location arrows.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="stack-text">Trace output</FieldLabel>
            <FieldContent>
              <Textarea
                id="stack-text"
                value={persist.text}
                onChange={(e) =>
                  setPersist((prev) => ({ ...prev, text: e.target.value }))
                }
                rows={16}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                disabled={!ready}
                placeholder="Paste Error: ... and at ... frames here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="stack-hide-modules"
                  checked={persist.hideNodeModules}
                  onCheckedChange={(checked) =>
                    setPersist((prev) => ({
                      ...prev,
                      hideNodeModules: checked,
                    }))
                  }
                  disabled={!ready}
                />
                <FieldLabel
                  htmlFor="stack-hide-modules"
                  className="mb-0 cursor-pointer"
                >
                  Hide node_modules
                </FieldLabel>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="stack-hide-internals"
                  checked={persist.hideInternals}
                  onCheckedChange={(checked) =>
                    setPersist((prev) => ({
                      ...prev,
                      hideInternals: checked,
                    }))
                  }
                  disabled={!ready}
                />
                <FieldLabel
                  htmlFor="stack-hide-internals"
                  className="mb-0 cursor-pointer"
                >
                  Hide node: / webpack-internal
                </FieldLabel>
              </div>
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
                onClick={clearText}
                disabled={!persist.text}
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
                    formatStackFramesPaths(result.unique),
                    "Copied paths (one per line).",
                  )
                }
                disabled={result.unique.length === 0}
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
                  void copyText(
                    formatStackFramesMarkdown(result.unique),
                    "Copied markdown report.",
                  )
                }
                disabled={result.unique.length === 0}
              >
                Copy markdown
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
          <StatRow label="Frames parsed" value={result.frames.length} />
          <StatRow label="Unique locations" value={result.unique.length} />
          <StatRow label="Filtered out" value={result.skipped} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unique frames</CardTitle>
          <CardDescription>
            Deduplicated by path and line — newest occurrence kept in the full
            list below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.unique.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No frames yet. Paste a stack trace or load the sample.
            </p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {result.unique.map((frame) => (
                <FrameRow
                  key={`${frame.path}:${frame.line}:${frame.sourceLine}`}
                  frame={frame}
                  onCopy={(text) => void copyText(text, "Copied location.")}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {result.frames.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All frames (call order)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {result.frames.map((frame, index) => (
                <FrameRow
                  key={`${index}-${frame.path}:${frame.line}`}
                  frame={frame}
                  onCopy={(text) => void copyText(text, "Copied location.")}
                />
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

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Tip: copy paths into Cursor chat as{" "}
        <code className="rounded bg-muted px-1">@path:line</code> references.
      </p>
    </div>
  )
}
