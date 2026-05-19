"use client"

import Link from "next/link"
import { format } from "date-fns"
import * as React from "react"
import { toast } from "sonner"

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
import { Spinner } from "@/components/ui/spinner"
import { parseEpochInput } from "@/lib/epoch/parse"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type ApiTimeResponse = {
  iso: string
  unixMs: number
}

type ServerTimePayload = ApiTimeResponse & {
  /** Browser time when the response was applied (for one-shot skew display). */
  clientMsWhenReceived: number
}

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Could not copy to clipboard"),
  )
}

export function EpochApp() {
  const [input, setInput] = React.useState("")
  const [server, setServer] = React.useState<ServerTimePayload | null>(null)
  const [serverLoading, setServerLoading] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const parsed = React.useMemo(() => parseEpochInput(input), [input])

  const refreshServer = React.useCallback(async () => {
    setServerLoading(true)
    setServerError(null)
    try {
      const res = await fetch("/api/time", { cache: "no-store" })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = (await res.json()) as ApiTimeResponse
      if (
        typeof data.iso !== "string" ||
        typeof data.unixMs !== "number" ||
        !Number.isFinite(data.unixMs)
      ) {
        throw new Error("Unexpected response")
      }
      const clientMsWhenReceived = Date.now()
      setServer({ ...data, clientMsWhenReceived })
    } catch {
      setServerError("Could not load server time.")
      setServer(null)
    } finally {
      setServerLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refreshServer()
  }, [refreshServer])

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Epoch lab</h1>
            <p className="text-sm text-muted-foreground">
              Turn Unix timestamps and ISO strings into readable instants, and
              compare with a tiny server clock.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Parse</CardTitle>
          <CardDescription>
            Try <span className="font-mono">1715865600000</span>,{" "}
            <span className="font-mono">1715865600</span>, or{" "}
            <span className="font-mono">2024-05-16T12:00:00Z</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="epoch-input">Instant input</FieldLabel>
            <FieldContent className="pt-2">
              <Input
                id="epoch-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Unix (s or ms), ISO-8601, or Date.parse string"
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-sm"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setInput(String(Date.now()))}
            >
              Use now (ms)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
            >
              Use now (s)
            </Button>
            <Button type="button" variant="ghost" onClick={() => setInput("")}>
              Clear
            </Button>
          </div>
          <Separator />
          {parsed ? (
            <ParsedSummary date={parsed} />
          ) : input.trim() ? (
            <p className="text-sm text-destructive" role="status">
              Could not parse that value.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground" role="status">
              Enter a value to see UTC, local, and copy targets.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Server clock</CardTitle>
            <CardDescription>
              From <span className="font-mono">GET /api/time</span> — handy for
              checking skew while testing agents and APIs.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshServer()}
            disabled={serverLoading}
          >
            {serverLoading ? (
              <>
                <Spinner className="mr-2 size-4" />
                Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : server ? (
            <ServerSummary payload={server} onCopy={copyText} />
          ) : serverLoading ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <Spinner className="size-4" />
              Loading server time…
            </div>
          ) : null}
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — epoch lab demo.
      </footer>
    </div>
  )
}

function ParsedSummary({ date }: { date: Date }) {
  const isoUtc = date.toISOString()
  const unixMs = String(date.getTime())
  const unixSec = String(Math.floor(date.getTime() / 1000))
  const localLine = format(date, "PPpp zzz")

  return (
    <dl className="grid gap-3 text-sm">
      <div className="rounded-lg border bg-muted/30 p-3">
        <dt className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
          Local
        </dt>
        <dd className="font-medium leading-snug">{localLine}</dd>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <CopyRow label="ISO (UTC)" value={isoUtc} onCopy={copyText} />
        <CopyRow label="Unix ms" value={unixMs} onCopy={copyText} />
        <CopyRow label="Unix s" value={unixSec} onCopy={copyText} />
      </div>
    </dl>
  )
}

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy: (label: string, text: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border px-3 py-2">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <code className="truncate font-mono text-xs">{value}</code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => onCopy(label, value)}
        >
          Copy
        </Button>
      </div>
    </div>
  )
}

function ServerSummary({
  payload,
  onCopy,
}: {
  payload: ServerTimePayload
  onCopy: (label: string, text: string) => void
}) {
  const serverDate = new Date(payload.unixMs)
  const skewMs =
    Number.isFinite(serverDate.getTime()) &&
    Number.isFinite(payload.clientMsWhenReceived)
      ? serverDate.getTime() - payload.clientMsWhenReceived
      : null

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <CopyRow label="Server ISO" value={payload.iso} onCopy={onCopy} />
        <CopyRow
          label="Server Unix ms"
          value={String(payload.unixMs)}
          onCopy={onCopy}
        />
      </div>
      {skewMs !== null ? (
        <p className="text-muted-foreground text-xs">
          Rough skew vs this browser when the response arrived:{" "}
          <span className="font-mono text-foreground">
            {skewMs >= 0 ? "+" : ""}
            {skewMs} ms
          </span>
        </p>
      ) : null}
    </div>
  )
}
