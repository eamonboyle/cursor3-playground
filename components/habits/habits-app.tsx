"use client"

import { format } from "date-fns"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
import { Spinner } from "@/components/ui/spinner"
import { defaultHabitsState, nextColorVar } from "@/lib/habits/defaults"
import { loadHabitsState, saveHabitsState } from "@/lib/habits/storage"
import { computeStreak } from "@/lib/habits/streak"
import type { HabitsState } from "@/lib/habits/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"

function toggleDate(dates: string[], key: string): string[] {
  const set = new Set(dates)
  if (set.has(key)) {
    set.delete(key)
  } else {
    set.add(key)
  }
  return [...set].sort()
}

export function HabitsApp() {
  const [state, setState] = React.useState<HabitsState>(() =>
    defaultHabitsState(),
  )
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    setState(loadHabitsState())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveHabitsState(state)
  }, [state])

  const [activeId, setActiveId] = React.useState<string>("")
  const [newName, setNewName] = React.useState("")

  React.useEffect(() => {
    if (!ready || state.habits.length === 0) {
      return
    }
    if (!activeId || !state.habits.some((h) => h.id === activeId)) {
      setActiveId(state.habits[0]!.id)
    }
  }, [ready, state.habits, activeId])

  const active = state.habits.find((h) => h.id === activeId)
  const dates = React.useMemo(
    () => (active ? (state.completions[active.id] ?? []) : []),
    [active, state.completions],
  )
  const dateSet = React.useMemo(() => new Set(dates), [dates])
  const streak = computeStreak(dates)

  const modifiers = React.useMemo(
    () => ({
      completed: (d: Date) => dateSet.has(format(d, "yyyy-MM-dd")),
    }),
    [dateSet],
  )

  function onDayClick(day: Date) {
    if (!active) {
      return
    }
    const key = format(day, "yyyy-MM-dd")
    setState((s) => {
      const prev = s.completions[active.id] ?? []
      return {
        ...s,
        completions: {
          ...s.completions,
          [active.id]: toggleDate(prev, key),
        },
      }
    })
  }

  function addHabit(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      toast.error("Enter a habit name.")
      return
    }
    const id = crypto.randomUUID()
    const colorVar = nextColorVar(state.habits)
    setState((s) => ({
      habits: [...s.habits, { id, name, colorVar }],
      completions: { ...s.completions, [id]: [] },
    }))
    setActiveId(id)
    setNewName("")
    toast.success("Habit added.")
  }

  function removeHabit(id: string) {
    setState((s) => {
      const completions = { ...s.completions }
      delete completions[id]
      return {
        habits: s.habits.filter((h) => h.id !== id),
        completions,
      }
    })
    toast.success("Habit removed.")
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading habits…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Calendar03Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Habit tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Click days on the calendar to log completions. Data is stored
              locally in your browser.
            </p>
          </div>
        </div>
      </header>

      {state.habits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No habits yet</EmptyTitle>
            <EmptyDescription>
              Add your first habit below to start tracking.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Select a habit, then click a day to toggle it complete for that
              date.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Field className="gap-1.5 sm:max-w-xs">
                <FieldLabel htmlFor="habit-select">Active habit</FieldLabel>
                <FieldContent>
                  <Select value={activeId} onValueChange={setActiveId}>
                    <SelectTrigger id="habit-select">
                      <SelectValue placeholder="Choose habit" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.habits.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-sm"
                              style={{
                                backgroundColor: `var(${h.colorVar})`,
                              }}
                              aria-hidden
                            />
                            {h.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              {active ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <Badge variant="secondary" className="font-mono tabular-nums">
                    {streak} day{streak === 1 ? "" : "s"}
                  </Badge>
                </div>
              ) : null}
            </div>
            <Calendar
              key={activeId}
              modifiers={modifiers}
              modifiersClassNames={{
                completed:
                  "bg-primary/20 font-medium text-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
              }}
              onDayClick={onDayClick}
              className="rounded-xl border p-2 shadow-xs"
            />
          </CardContent>
        </Card>

        <Card className="lg:min-w-[240px]">
          <CardHeader>
            <CardTitle className="text-base">Habits</CardTitle>
            <CardDescription>Manage your list.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {state.habits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: `var(${h.colorVar})` }}
                      aria-hidden
                    />
                    <span className="truncate font-medium">{h.name}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeHabit(h.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <Separator />
            <form onSubmit={addHabit} className="flex flex-col gap-2">
              <Field>
                <FieldLabel htmlFor="new-habit">New habit</FieldLabel>
                <FieldContent className="flex gap-2">
                  <Input
                    id="new-habit"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Morning stretch"
                  />
                  <Button type="submit">Add</Button>
                </FieldContent>
              </Field>
            </form>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — habit demo.
      </footer>
    </div>
  )
}
