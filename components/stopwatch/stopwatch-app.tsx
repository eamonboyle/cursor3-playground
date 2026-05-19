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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Copy01Icon, StopWatchIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type RunState = "idle" | "running" | "paused"

type Lap = {
  id: string
  index: number
  splitMs: number
  totalMs: number
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function formatMs(ms: number) {
  const x = Math.max(0, ms)
  const totalSeconds = Math.floor(x / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  const cs = Math.floor((x % 1000) / 10)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`
}

export function StopwatchApp() {
  const [runState, setRunState] = React.useState<RunState>("idle")
  const [elapsedMs, setElapsedMs] = React.useState(0)
  const segmentStartRef = React.useRef<number | null>(null)
  const [displayMs, setDisplayMs] = React.useState(0)
  const [laps, setLaps] = React.useState<Lap[]>([])
  const lastLapTotalRef = React.useRef(0)

  React.useEffect(() => {
    if (runState !== "running") {
      setDisplayMs(elapsedMs)
      return
    }
    let id = 0
    function loop() {
      if (segmentStartRef.current != null) {
        setDisplayMs(
          elapsedMs + (performance.now() - segmentStartRef.current),
        )
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [runState, elapsedMs])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat) {
        return
      }
      if (isTypingTarget(e.target)) {
        return
      }
      if (e.code === "Space") {
        e.preventDefault()
        if (runState === "running") {
          if (segmentStartRef.current == null) {
            return
          }
          const next =
            elapsedMs + (performance.now() - segmentStartRef.current)
          setElapsedMs(next)
          segmentStartRef.current = null
          setRunState("paused")
          setDisplayMs(next)
        } else if (runState === "paused") {
          segmentStartRef.current = performance.now()
          setRunState("running")
        } else {
          segmentStartRef.current = performance.now()
          setRunState("running")
        }
        return
      }
      if (e.key.toLowerCase() === "l" && runState === "running") {
        e.preventDefault()
        if (segmentStartRef.current == null) {
          return
        }
        const total =
          elapsedMs + (performance.now() - segmentStartRef.current)
        const split = total - lastLapTotalRef.current
        lastLapTotalRef.current = total
        setLaps((prev) => [
          {
            id: crypto.randomUUID(),
            index: prev.length + 1,
            splitMs: split,
            totalMs: total,
          },
          ...prev,
        ])
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [runState, elapsedMs])

  function start() {
    if (runState === "running") {
      return
    }
    segmentStartRef.current = performance.now()
    setRunState("running")
  }

  function pause() {
    if (runState !== "running" || segmentStartRef.current == null) {
      return
    }
    const next = elapsedMs + (performance.now() - segmentStartRef.current)
    setElapsedMs(next)
    segmentStartRef.current = null
    setRunState("paused")
    setDisplayMs(next)
  }

  function resume() {
    if (runState !== "paused") {
      return
    }
    segmentStartRef.current = performance.now()
    setRunState("running")
  }

  function lap() {
    if (runState !== "running" || segmentStartRef.current == null) {
      return
    }
    const total = elapsedMs + (performance.now() - segmentStartRef.current)
    const split = total - lastLapTotalRef.current
    lastLapTotalRef.current = total
    setLaps((prev) => [
      {
        id: crypto.randomUUID(),
        index: prev.length + 1,
        splitMs: split,
        totalMs: total,
      },
      ...prev,
    ])
  }

  function reset() {
    segmentStartRef.current = null
    setRunState("idle")
    setElapsedMs(0)
    setDisplayMs(0)
    setLaps([])
    lastLapTotalRef.current = 0
  }

  async function copyLaps() {
    if (laps.length === 0) {
      toast.message("No laps yet.")
      return
    }
    const lines = [
      "lap\tsplit\ttotal",
      ...laps
        .slice()
        .reverse()
        .map(
          (lapRow) =>
            `${lapRow.index}\t${formatMs(lapRow.splitMs)}\t${formatMs(lapRow.totalMs)}`,
        ),
    ]
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      toast.success("Copied laps as TSV.")
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
            icon={StopWatchIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Stopwatch
            </h1>
            <p className="text-sm text-muted-foreground">
              Count-up timer with lap splits.{" "}
              <span className="font-mono text-muted-foreground/90">
                Space
              </span>{" "}
              starts or pauses;{" "}
              <span className="font-mono text-muted-foreground/90">L</span>{" "}
              records a lap while running.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Timer</CardTitle>
          <CardDescription>
            {runState === "running"
              ? "Running."
              : runState === "paused"
                ? "Paused."
                : "Press start or Space."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div
            className="flex flex-col items-center gap-2"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Elapsed ${formatMs(displayMs)}`}
          >
            <span className="font-mono text-5xl font-medium tabular-nums tracking-tight">
              {formatMs(displayMs)}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {runState !== "running" ? (
              <Button type="button" onClick={runState === "paused" ? resume : start}>
                {runState === "paused" ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={pause}>
                Pause
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={lap}
              disabled={runState !== "running"}
            >
              Lap
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Reset stops the clock and clears laps and elapsed time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Laps</CardTitle>
            <CardDescription>Newest lap on top.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={copyLaps}
            disabled={laps.length === 0}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" aria-hidden />
            Copy TSV
          </Button>
        </CardHeader>
        <CardContent>
          {laps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No laps yet. Use Lap or press{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                L
              </kbd>{" "}
              while running.
            </p>
          ) : (
            <>
              <Separator className="mb-4" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Lap</TableHead>
                    <TableHead className="text-right">Split</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laps.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.index}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMs(row.splitMs)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMs(row.totalMs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — stopwatch demo.
      </footer>
    </div>
  )
}
