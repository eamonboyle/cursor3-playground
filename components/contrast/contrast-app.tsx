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
import { analyzeContrast, rgbToHex } from "@/lib/contrast/compute"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDataTransferHorizontalIcon,
  Copy01Icon,
  UniversalAccessIcon,
} from "@hugeicons/core-free-icons"

const DEFAULT_FG = "#0a0a0a"
const DEFAULT_BG = "#fafafa"

function PassRow({
  label,
  threshold,
  pass,
}: {
  label: string
  threshold: string
  pass: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        {label}{" "}
        <span className="font-mono text-[0.7rem] text-muted-foreground/80">
          ({threshold})
        </span>
      </span>
      <Badge variant={pass ? "default" : "destructive"} className="shrink-0">
        {pass ? "Pass" : "Fail"}
      </Badge>
    </div>
  )
}

export function ContrastApp() {
  const [foreground, setForeground] = React.useState(DEFAULT_FG)
  const [background, setBackground] = React.useState(DEFAULT_BG)

  const analysis = React.useMemo(
    () => analyzeContrast(foreground, background),
    [foreground, background],
  )

  const fgCss = analysis ? rgbToHex(analysis.foreground) : foreground
  const bgCss = analysis ? rgbToHex(analysis.background) : background

  function swapColors() {
    setForeground(background)
    setBackground(foreground)
  }

  async function copyRatio() {
    if (!analysis) {
      toast.error("Enter valid hex colors first.")
      return
    }
    try {
      await navigator.clipboard.writeText(analysis.ratioLabel)
      toast.success("Copied contrast ratio.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={UniversalAccessIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Contrast checker
            </h1>
            <p className="text-muted-foreground text-sm">
              WCAG 2.x ratio for text on a solid background (#RGB or #RRGGBB).
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>
            Foreground is the text color; background fills the canvas behind it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contrast-fg">Foreground</FieldLabel>
              <FieldContent>
                <Input
                  id="contrast-fg"
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                  aria-invalid={!analysis && foreground.trim().length > 0}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="contrast-bg">Background</FieldLabel>
              <FieldContent>
                <Input
                  id="contrast-bg"
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  aria-invalid={!analysis && background.trim().length > 0}
                />
              </FieldContent>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={swapColors}>
              <HugeiconsIcon
                icon={ArrowDataTransferHorizontalIcon}
                strokeWidth={2}
                className="mr-1.5 size-4"
                aria-hidden
              />
              Swap colors
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyRatio}
              disabled={!analysis}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="mr-1.5 size-4"
                aria-hidden
              />
              Copy ratio
            </Button>
          </div>

          <div
            className="rounded-xl border border-border/80 p-6 shadow-inner"
            style={{ backgroundColor: bgCss, color: fgCss }}
          >
            <p className="font-display text-lg font-medium leading-snug tracking-tight">
              The quick brown fox jumps over the lazy dog.
            </p>
            <p className="mt-3 text-sm leading-relaxed opacity-90">
              Large text is 18pt+ regular or 14pt+ bold. Use the table below to
              see whether this pairing clears WCAG AA and AAA thresholds.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Ratios compare relative luminance of the two sRGB colors (including
            transparency is not supported in this demo).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!analysis ? (
            <p className="text-muted-foreground text-sm" role="status">
              Enter two valid hex colors (for example{" "}
              <span className="font-mono text-foreground">#1a1a1a</span> and{" "}
              <span className="font-mono text-foreground">#f5f5f5</span>).
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-4xl font-medium tracking-tight">
                  {analysis.ratioLabel}
                </span>
                <span className="text-muted-foreground text-sm">
                  contrast between{" "}
                  <span className="font-mono text-foreground">{fgCss}</span> and{" "}
                  <span className="font-mono text-foreground">{bgCss}</span>
                </span>
              </div>
              <Separator />
              <div className="space-y-3">
                <PassRow
                  label="AA — normal text"
                  threshold="≥ 4.5:1"
                  pass={analysis.passes.aaNormal}
                />
                <PassRow
                  label="AA — large text"
                  threshold="≥ 3:1"
                  pass={analysis.passes.aaLarge}
                />
                <PassRow
                  label="AAA — normal text"
                  threshold="≥ 7:1"
                  pass={analysis.passes.aaaNormal}
                />
                <PassRow
                  label="AAA — large text"
                  threshold="≥ 4.5:1"
                  pass={analysis.passes.aaaLarge}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
