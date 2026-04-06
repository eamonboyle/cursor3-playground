"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { loadSavedLinks, saveSavedLinks } from "@/lib/links/storage"
import type { SavedLink } from "@/lib/links/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link01Icon } from "@hugeicons/core-free-icons"

type PreviewResponse = {
  title: string
  description?: string
  image?: string
}

export function LinksApp() {
  const [items, setItems] = React.useState<SavedLink[]>([])
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  const [urlInput, setUrlInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setItems(loadSavedLinks())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveSavedLinks(items)
  }, [items])

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    const url = urlInput.trim()
    if (!url) {
      toast.error("Enter a URL.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/links/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not fetch preview."
        throw new Error(msg)
      }
      const preview = data as PreviewResponse
      const normalized = url.startsWith("http") ? url : `https://${url}`
      const link: SavedLink = {
        id: crypto.randomUUID(),
        url: normalized,
        title: preview.title || normalized,
        description: preview.description,
        image: preview.image,
        savedAt: new Date().toISOString(),
      }
      setItems((prev) => [link, ...prev])
      setUrlInput("")
      toast.success("Link saved.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function removeLink(id: string) {
    setItems((prev) => prev.filter((l) => l.id !== id))
    toast.success("Removed link.")
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading links…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Link01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Link organizer
            </h1>
            <p className="text-sm text-muted-foreground">
              Paste a URL to pull Open Graph metadata via a Route Handler. Saved
              links stay in your browser.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add link</CardTitle>
          <CardDescription>
            Many sites allow preview fetches; some block bots or require login.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Preview failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={addLink} className="flex flex-col gap-4 sm:flex-row">
            <Field className="flex-1">
              <FieldLabel htmlFor="link-url">URL</FieldLabel>
              <FieldContent>
                <Input
                  id="link-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={loading}
                />
              </FieldContent>
            </Field>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 sm:w-auto [&:not(:disabled)]:inline-flex"
              >
                {loading ? (
                  <>
                    <Spinner className="size-4" />
                    Fetching…
                  </>
                ) : (
                  "Save link"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No saved links</EmptyTitle>
            <EmptyDescription>
              Add a URL above to build your reading list.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="h-full overflow-hidden pt-0">
                {item.image ? (
                  <div className="relative aspect-video w-full bg-muted">
                    {/* Remote OG images: use native img for arbitrary URLs. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                ) : null}
                <CardHeader className="gap-2">
                  <CardTitle className="line-clamp-2 text-base leading-snug">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </a>
                  </CardTitle>
                  {item.description ? (
                    <CardDescription className="line-clamp-3">
                      {item.description}
                    </CardDescription>
                  ) : (
                    <CardDescription className="font-mono text-xs">
                      {item.url}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex justify-end pt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeLink(item.id)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — links demo with{" "}
        <span className="font-mono">POST /api/links/preview</span>.
      </footer>
    </div>
  )
}
