"use client"

import Link from "next/link"
import * as React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RsvpCountsChart } from "@/components/rsvp/rsvp-counts-chart"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ApiResponse = {
  total: number
  counts: { yes: number; no: number; maybe: number }
  entries: {
    id: string
    name: string
    email: string
    status: string
    message: string
    createdAt: string
  }[]
}

export function RsvpHostApp() {
  const [data, setData] = React.useState<ApiResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/rsvp")
      if (!res.ok) {
        throw new Error("Failed to load responses.")
      }
      const json = (await res.json()) as ApiResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const rows =
    data == null
      ? []
      : [
          { name: "Yes", count: data.counts.yes },
          { name: "Maybe", count: data.counts.maybe },
          { name: "No", count: data.counts.no },
        ]

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/rsvp">Public RSVP form</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            RSVP host dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            In-memory demo data only — refreshes when the dev server restarts.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Spinner className="size-5" />
          Loading responses…
        </div>
      ) : data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                {data.total} response{data.total === 1 ? "" : "s"} total.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RsvpCountsChart rows={rows} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent entries</CardTitle>
              <CardDescription>Newest first.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.entries]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {new Date(e.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{e.name}</TableCell>
                        <TableCell className="max-w-[140px] truncate font-mono text-xs">
                          {e.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
                          {e.message || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — RSVP host (
        <span className="font-mono">GET /api/rsvp</span>).
      </footer>
    </div>
  )
}
