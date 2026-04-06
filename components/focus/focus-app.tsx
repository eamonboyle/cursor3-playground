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
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import {
  loadFocusPersisted,
  saveFocusPersisted,
  type FocusPersisted,
} from "@/lib/focus/storage"
import { HugeiconsIcon } from "@hugeicons/react"
import { Timer01Icon } from "@hugeicons/core-free-icons"

type Phase = "work" | "break"
type RunState = "idle" | "running" | "paused"

export function FocusApp() {
  const [persist, setPersist] = React.useState<FocusPersisted>(() => ({
    tasks: [],
    workMinutes: 25,
    breakMinutes: 5,
  }))
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  const [phase, setPhase] = React.useState<Phase>("work")
  const [runState, setRunState] = React.useState<RunState>("idle")
  const [secondsLeft, setSecondsLeft] = React.useState(0)

  const [taskDraft, setTaskDraft] = React.useState("")

  React.useEffect(() => {
    const p = loadFocusPersisted()
    setPersist(p)
    setSecondsLeft(Math.round(p.workMinutes * 60))
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveFocusPersisted(persist)
  }, [persist])

  const totalSeconds =
    phase === "work"
      ? Math.round(persist.workMinutes * 60)
      : Math.round(persist.breakMinutes * 60)

  const progressPct =
    totalSeconds > 0
      ? ((totalSeconds - secondsLeft) / totalSeconds) * 100
      : 0

  React.useEffect(() => {
    if (runState !== "running" || secondsLeft <= 0) {
      return
    }
    const id = window.setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [runState, secondsLeft])

  React.useEffect(() => {
    if (runState !== "running" || secondsLeft > 0) {
      return
    }
    const next: Phase = phase === "work" ? "break" : "work"
    toast.success(
      phase === "work" ? "Work session complete. Take a break." : "Break over. Back to work.",
    )
    setPhase(next)
    const nextTotal =
      next === "work"
        ? Math.round(persist.workMinutes * 60)
        : Math.round(persist.breakMinutes * 60)
    setSecondsLeft(nextTotal)
  }, [runState, secondsLeft, phase, persist.workMinutes, persist.breakMinutes])

  function startTimer() {
    if (secondsLeft <= 0) {
      setSecondsLeft(totalSeconds)
    }
    setRunState("running")
  }

  function pauseTimer() {
    setRunState("paused")
  }

  function resetTimer() {
    setRunState("idle")
    setPhase("work")
    setSecondsLeft(Math.round(persist.workMinutes * 60))
  }

  React.useEffect(() => {
    if (runState !== "idle") {
      return
    }
    setSecondsLeft(
      Math.round(
        (phase === "work" ? persist.workMinutes : persist.breakMinutes) * 60,
      ),
    )
  }, [
    persist.workMinutes,
    persist.breakMinutes,
    phase,
    runState,
  ])

  function addTask(e: React.FormEvent) {
    e.preventDefault()
    const text = taskDraft.trim()
    if (!text) {
      return
    }
    setPersist((p) => ({
      ...p,
      tasks: [...p.tasks, { id: crypto.randomUUID(), text, done: false }],
    }))
    setTaskDraft("")
  }

  function toggleTask(id: string, done: boolean) {
    setPersist((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === id ? { ...t, done } : t)),
    }))
  }

  function removeTask(id: string) {
    setPersist((p) => ({
      ...p,
      tasks: p.tasks.filter((t) => t.id !== id),
    }))
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading focus timer…</span>
      </div>
    )
  }

  const mm = Math.floor(Math.max(0, secondsLeft) / 60)
  const ss = Math.max(0, secondsLeft) % 60

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Timer01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Focus timer
            </h1>
            <p className="text-sm text-muted-foreground">
              Pomodoro-style sessions with a simple task list. Settings persist
              locally.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>
                {phase === "work" ? "Focus" : "Break"}
              </CardTitle>
              <CardDescription>
                {runState === "running"
                  ? "Timer is running."
                  : runState === "paused"
                    ? "Paused."
                    : "Press start when you are ready."}
              </CardDescription>
            </div>
            <BadgePhase phase={phase} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div
            className="flex flex-col items-center gap-2"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${mm} minutes ${ss} seconds remaining`}
          >
            <span className="font-mono text-5xl font-medium tabular-nums tracking-tight">
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </span>
            <Progress value={progressPct} className="h-2 w-full max-w-sm" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {runState !== "running" ? (
              <Button type="button" onClick={startTimer}>
                {runState === "paused" ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={pauseTimer}>
                Pause
              </Button>
            )}
            <Button type="button" variant="outline" onClick={resetTimer}>
              Reset
            </Button>
          </div>
          <Separator />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel>Work length (minutes)</FieldLabel>
              <FieldContent className="flex flex-col gap-3 pt-2">
                <Slider
                  value={[persist.workMinutes]}
                  onValueChange={([v]) =>
                    setPersist((p) => ({ ...p, workMinutes: v ?? 25 }))
                  }
                  min={5}
                  max={60}
                  step={1}
                  disabled={runState !== "idle"}
                  aria-label="Work session length in minutes"
                />
                <span className="text-center font-mono text-sm text-muted-foreground tabular-nums">
                  {persist.workMinutes} min
                </span>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Break length (minutes)</FieldLabel>
              <FieldContent className="flex flex-col gap-3 pt-2">
                <Slider
                  value={[persist.breakMinutes]}
                  onValueChange={([v]) =>
                    setPersist((p) => ({ ...p, breakMinutes: v ?? 5 }))
                  }
                  min={1}
                  max={30}
                  step={1}
                  disabled={runState !== "idle"}
                  aria-label="Break length in minutes"
                />
                <span className="text-center font-mono text-sm text-muted-foreground tabular-nums">
                  {persist.breakMinutes} min
                </span>
              </FieldContent>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Lightweight checklist for this session.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={addTask} className="flex gap-2">
            <Input
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              placeholder="Add a task"
              aria-label="New task"
            />
            <Button type="submit">Add</Button>
          </form>
          <ul className="flex flex-col gap-2">
            {persist.tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <Checkbox
                  checked={t.done}
                  onCheckedChange={(c) => toggleTask(t.id, c === true)}
                  aria-label={`Done: ${t.text}`}
                />
                <span
                  className={
                    t.done ? "flex-1 text-muted-foreground line-through" : "flex-1"
                  }
                >
                  {t.text}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeTask(t.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — focus demo.
      </footer>
    </div>
  )
}

function BadgePhase({ phase }: { phase: Phase }) {
  return (
    <span
      className={
        phase === "work"
          ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
          : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {phase === "work" ? "Work" : "Break"}
    </span>
  )
}
