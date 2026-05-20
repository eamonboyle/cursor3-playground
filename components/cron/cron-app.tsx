"use client"

import Link from "next/link"
import { format } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CRON_FIELD_LABELS, splitCronFields } from "@/lib/cron/fields"
import {
  analyzeCronExpression,
  CRON_PRESETS,
} from "@/lib/cron/parse"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Copy01Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons"

const STORAGE_KEY = "playground-cron-expression"
const DEFAULT_EXPRESSION = "0 8 * * *"

type TimezoneMode = "local" | "utc"

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Could not copy to clipboard"),
  )
}

export function CronApp() {
  const [expression, setExpression] = React.useState(DEFAULT_EXPRESSION)
  const [tzMode, setTzMode] = React.useState<TimezoneMode>("local")
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved?.trim()) {
        setExpression(saved.trim())
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) {
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, expression)
    } catch {
      /* ignore */
    }
  }, [expression, hydrated])

  const analysis = React.useMemo(
    () =>
      analyzeCronExpression(expression, {
        count: 10,
        tz: tzMode === "utc" ? "UTC" : undefined,
      }),
    [expression, tzMode],
  )

  const fields = React.useMemo(
    () => splitCronFields(expression),
    [expression],
  )

  const tzLabel =
    tzMode === "utc"
      ? "UTC"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground w-fit text-sm font-medium transition-colors"
        >
          ← Playground
        </Link>
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <HugeiconsIcon
              icon={TimeScheduleIcon}
              strokeWidth={2}
              className="size-5"
              aria-hidden
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Cron lab
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Parse standard five-field cron expressions, preview upcoming run
              times, and sanity-check automation schedules like{" "}
              <code className="font-mono text-[0.8rem]">0 8 * * *</code>.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expression</CardTitle>
          <CardDescription>
            Minute, hour, day-of-month, month, and weekday. Uses{" "}
            <span className="font-mono text-xs">cron-parser</span> on the client.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="cron-input">Cron string</FieldLabel>
            <FieldContent>
              <Input
                id="cron-input"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="0 8 * * *"
                className="font-mono"
                spellCheck={false}
                autoComplete="off"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Timezone for next runs</FieldLabel>
            <FieldContent>
              <Select
                value={tzMode}
                onValueChange={(v) => setTzMode(v as TimezoneMode)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local ({tzLabel})</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <div className="flex flex-wrap gap-2">
            {CRON_PRESETS.map((preset) => (
              <Button
                key={preset.expression}
                type="button"
                variant="outline"
                size="sm"
                className="font-mono text-xs"
                onClick={() => setExpression(preset.expression)}
                title={preset.hint}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {fields ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-5">
              {fields.map((value, i) => (
                <div
                  key={CRON_FIELD_LABELS[i]}
                  className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5"
                >
                  <dt className="text-muted-foreground font-mono text-[0.62rem] font-medium uppercase tracking-widest">
                    {CRON_FIELD_LABELS[i]}
                  </dt>
                  <dd className="font-mono mt-1 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Next runs</CardTitle>
            <CardDescription className="mt-1">
              Upcoming schedule in {tzLabel}
            </CardDescription>
          </div>
          {analysis.valid ? (
            <Badge variant="default" className="shrink-0">
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive" className="shrink-0">
              Invalid
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {analysis.valid ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Local display</TableHead>
                  <TableHead className="hidden sm:table-cell">ISO</TableHead>
                  <TableHead className="w-20 text-right">Copy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.nextRuns.map((date, index) => (
                  <TableRow key={date.toISOString()}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(date, "EEE, MMM d yyyy · HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs sm:table-cell">
                      {date.toISOString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Copy run ${index + 1} ISO`}
                        onClick={() =>
                          copyText(`Run ${index + 1}`, date.toISOString())
                        }
                      >
                        <HugeiconsIcon
                          icon={Copy01Icon}
                          strokeWidth={2}
                          className="size-4"
                          aria-hidden
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-destructive text-sm leading-relaxed" role="alert">
              {analysis.error}
            </p>
          )}
        </CardContent>
      </Card>

      {analysis.valid ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              copyText(
                "All runs",
                analysis.nextRuns.map((d) => d.toISOString()).join("\n"),
              )
            }
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-4"
              aria-hidden
            />
            Copy all ISO lines
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copyText("Expression", analysis.expression)}
          >
            Copy expression
          </Button>
        </div>
      ) : null}

      <Separator />

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={2}
              className="text-primary size-4"
              aria-hidden
            />
            Automation tie-in
          </CardTitle>
          <CardDescription>
            Cursor automations can trigger on cron schedules. Use this lab to
            confirm when <code className="font-mono text-xs">0 8 * * *</code>{" "}
            fires before wiring a workflow.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
