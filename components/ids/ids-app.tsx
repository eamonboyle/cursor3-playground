"use client"

import Link from "next/link"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { defaultIdsPersisted } from "@/lib/ids/defaults"
import { generateMany } from "@/lib/ids/generate"
import { loadIdsPersisted, saveIdsPersisted } from "@/lib/ids/storage"
import type { IdFormat, IdsPersisted } from "@/lib/ids/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, KeyGeneratorFobIcon } from "@hugeicons/core-free-icons"

export function IdsApp() {
  const [persist, setPersist] = React.useState<IdsPersisted>(() =>
    defaultIdsPersisted(),
  )
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)
  const [rows, setRows] = React.useState<string[]>([])

  React.useEffect(() => {
    React.startTransition(() => {
      setPersist(loadIdsPersisted())
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveIdsPersisted(persist)
  }, [persist])

  React.useEffect(() => {
    if (!ready) {
      return
    }
    React.startTransition(() => {
      setRows(
        generateMany(persist.format, persist.count, {
          entropyBytes: persist.entropyBytes,
          hexUppercase: persist.hexUppercase,
        }),
      )
    })
  }, [ready, persist])

  function regenerate() {
    setRows(
      generateMany(persist.format, persist.count, {
        entropyBytes: persist.entropyBytes,
        hexUppercase: persist.hexUppercase,
      }),
    )
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${label}.`)
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading ID lab…</span>
      </div>
    )
  }

  const bulk = rows.join("\n")

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={KeyGeneratorFobIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ID lab</h1>
            <p className="text-sm text-muted-foreground">
              Cryptographic UUIDs, hex secrets, and URL-safe tokens from the
              browser Web Crypto API. Nothing leaves your machine.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Generator</CardTitle>
          <CardDescription>
            Adjust format and strength, then copy one value or the full batch.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Field>
            <FieldLabel id="ids-format-label">Format</FieldLabel>
            <FieldContent className="pt-2">
              <Select
                value={persist.format}
                onValueChange={(v: IdFormat) =>
                  setPersist((p) => ({ ...p, format: v }))
                }
              >
                <SelectTrigger
                  size="default"
                  className="w-full max-w-md"
                  aria-labelledby="ids-format-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uuid">UUID (version 4)</SelectItem>
                  <SelectItem value="hex">Hex string</SelectItem>
                  <SelectItem value="base64url">URL-safe Base64</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          {persist.format !== "uuid" ? (
            <Field>
              <FieldLabel>Entropy (bytes)</FieldLabel>
              <FieldContent className="flex flex-col gap-3 pt-2">
                <Slider
                  value={[persist.entropyBytes]}
                  onValueChange={([v]) =>
                    setPersist((p) => ({
                      ...p,
                      entropyBytes: Math.min(32, Math.max(4, v ?? 16)),
                    }))
                  }
                  min={4}
                  max={32}
                  step={1}
                  aria-label="Random bytes used for each token"
                />
                <span className="text-center font-mono text-sm text-muted-foreground tabular-nums">
                  {persist.entropyBytes} bytes
                </span>
              </FieldContent>
            </Field>
          ) : null}

          {persist.format === "hex" ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Uppercase hex</p>
                <p className="text-xs text-muted-foreground">
                  Lowercase matches most CLI tools.
                </p>
              </div>
              <Switch
                checked={persist.hexUppercase}
                onCheckedChange={(c) =>
                  setPersist((p) => ({ ...p, hexUppercase: c === true }))
                }
                aria-label="Use uppercase hexadecimal"
              />
            </div>
          ) : null}

          <Field>
            <FieldLabel>How many</FieldLabel>
            <FieldContent className="flex flex-col gap-3 pt-2">
              <Slider
                value={[persist.count]}
                onValueChange={([v]) =>
                  setPersist((p) => ({
                    ...p,
                    count: Math.min(50, Math.max(1, v ?? 5)),
                  }))
                }
                min={1}
                max={50}
                step={1}
                aria-label="Number of identifiers to generate"
              />
              <span className="text-center font-mono text-sm text-muted-foreground tabular-nums">
                {persist.count} values
              </span>
            </FieldContent>
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={regenerate}>
              Shuffle new set
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => copyText("all values", bulk)}
            >
              Copy all
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
          <CardDescription>
            One value per line. Tap a row to copy that line only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ScrollArea className="h-[min(360px,50vh)] rounded-xl border">
            <ul className="divide-y p-1">
              {rows.map((line, i) => (
                <li key={`${i}-${line}`}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => copyText("value", line)}
                  >
                    <HugeiconsIcon
                      icon={Copy01Icon}
                      strokeWidth={2}
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed sm:text-sm">
                      {line}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <div className="space-y-2">
            <FieldLabel htmlFor="ids-bulk">Bulk (newline-separated)</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="ids-bulk"
                readOnly
                value={bulk}
                className="font-mono text-xs"
                aria-label="All generated values"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyText("all values", bulk)}
                aria-label="Copy all values"
              >
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — ID lab uses{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
          crypto.randomUUID
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
          crypto.getRandomValues
        </code>
        .
      </footer>
    </div>
  )
}
