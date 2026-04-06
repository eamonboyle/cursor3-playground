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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon } from "@hugeicons/core-free-icons"

export function RsvpFormApp() {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState("yes")
  const [message, setMessage] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, status, message }),
      })
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not save RSVP."
        throw new Error(msg)
      }
      toast.success("RSVP recorded. Thanks!")
      setName("")
      setEmail("")
      setStatus("yes")
      setMessage("")
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Mail01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Event RSVP
            </h1>
            <p className="text-sm text-muted-foreground">
              Demo form posts to a Route Handler; responses live in server
              memory until the process restarts.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Will you attend?</CardTitle>
          <CardDescription>
            Fake event for the playground — no emails are sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Could not submit</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="rsvp-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="rsvp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="rsvp-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="rsvp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="rsvp-status">Response</FieldLabel>
              <FieldContent>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="rsvp-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, I will attend</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="no">Can&apos;t make it</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="rsvp-msg">Message (optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  id="rsvp-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </FieldContent>
            </Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Submit RSVP"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Host view:{" "}
        <Link href="/rsvp/host" className="text-primary underline-offset-4 hover:underline">
          /rsvp/host
        </Link>
      </p>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — RSVP demo (
        <span className="font-mono">POST /api/rsvp</span>).
      </footer>
    </div>
  )
}
