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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_ROUTE_PATHS } from "@/lib/routes/defaults"
import {
  formatRoutesMarkdown,
  formatRoutesPaths,
  formatRoutesTree,
  parseRoutePaths,
} from "@/lib/routes/parse"
import type { RouteKind } from "@/lib/routes/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Route01Icon,
} from "@hugeicons/core-free-icons"

const KIND_VARIANT: Record<
  RouteKind,
  "default" | "secondary" | "destructive" | "outline"
> = {
  page: "default",
  api: "secondary",
  layout: "outline",
  loading: "outline",
  error: "destructive",
  "not-found": "outline",
  template: "outline",
  other: "outline",
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

export function RoutesApp() {
  const [input, setInput] = React.useState(SAMPLE_ROUTE_PATHS)
  const [pagesOnly, setPagesOnly] = React.useState(false)

  const result = React.useMemo(() => parseRoutePaths(input), [input])

  const visibleRoutes = React.useMemo(() => {
    if (!pagesOnly) {
      return result.routes
    }
    return result.routes.filter(
      (route) => route.kind === "page" || route.kind === "api",
    )
  }, [pagesOnly, result.routes])

  async function copyText(label: string, text: string) {
    if (!text.trim()) {
      toast.error("Nothing to copy yet.")
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Route01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              App Router lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste file paths under app/ to list Next.js pages, API routes, and
              special files with copyable URL paths.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Path input</CardTitle>
          <CardDescription>
            Run{" "}
            <code className="text-xs">find app -type f | sort</code> or paste a
            file tree. Route groups{" "}
            <code className="text-xs">(marketing)</code>, parallel{" "}
            <code className="text-xs">@slot</code>, and private{" "}
            <code className="text-xs">_folder</code> segments are stripped from
            URLs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="routes-input">Repo paths</FieldLabel>
            <FieldContent>
              <Textarea
                id="routes-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={14}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput(SAMPLE_ROUTE_PATHS)}
            >
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("")}
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
                  "Copied markdown summary.",
                  formatRoutesMarkdown(result),
                )
              }
              disabled={result.routes.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy summary
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied URL paths.",
                  formatRoutesPaths(result),
                )
              }
              disabled={result.summary.pages + result.summary.apis === 0}
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
                void copyText("Copied route tree.", formatRoutesTree(result))
              }
              disabled={result.summary.pages === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy tree
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <p
                  key={warning}
                  className="text-muted-foreground text-sm leading-relaxed"
                >
                  {warning}
                </p>
              ))}
            </div>
          )}

          {result.routes.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Pages" value={result.summary.pages} />
                <StatRow label="API routes" value={result.summary.apis} />
                <StatRow label="Layouts" value={result.summary.layouts} />
                <StatRow label="Special files" value={result.summary.special} />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="routes-pages-only"
                  checked={pagesOnly}
                  onCheckedChange={setPagesOnly}
                />
                <label
                  htmlFor="routes-pages-only"
                  className="text-sm leading-none"
                >
                  Show pages and API routes only
                </label>
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>URL path</TableHead>
                      <TableHead>File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRoutes.map((route, index) => (
                      <TableRow key={`${route.file}-${index}`}>
                        <TableCell>
                          <Badge variant={KIND_VARIANT[route.kind]}>
                            {route.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {route.path}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate font-mono text-xs sm:max-w-md">
                          {route.file}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
