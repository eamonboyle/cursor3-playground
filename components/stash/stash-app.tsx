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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_STASH_LIST } from "@/lib/stash/defaults"
import {
  formatStashCommand,
  formatStashMarkdown,
  formatStashRefs,
  parseStashList,
  stashDisplayTitle,
} from "@/lib/stash/parse"
import type { StashEntry, StashKind } from "@/lib/stash/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons"

const KIND_VARIANT: Record<
  StashKind,
  "default" | "secondary" | "destructive" | "outline"
> = {
  wip: "default",
  branch: "secondary",
  untracked: "outline",
  custom: "outline",
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

function StashRow({ entry }: { entry: StashEntry }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{entry.ref}</TableCell>
      <TableCell>
        <Badge variant={KIND_VARIANT[entry.kind]}>{entry.kind}</Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs sm:max-w-xs">
        {entry.branch ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs">
        {entry.commit ? entry.commit.slice(0, 7) : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground max-w-xs truncate text-xs">
        {stashDisplayTitle(entry)}
      </TableCell>
    </TableRow>
  )
}

export function StashApp() {
  const [input, setInput] = React.useState(SAMPLE_STASH_LIST)

  const result = React.useMemo(() => parseStashList(input), [input])

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
            icon={Layers01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git stash lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste git stash list output — index entries by branch and commit,
              copy apply, pop, show, or drop commands.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stash list</CardTitle>
          <CardDescription>
            Run <code className="text-xs">git stash list</code> and paste the
            output. WIP, branch, untracked, and custom stash messages are
            detected automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="stash-input">git stash list</FieldLabel>
            <FieldContent>
              <Textarea
                id="stash-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
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
              onClick={() => setInput(SAMPLE_STASH_LIST)}
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
                  formatStashMarkdown(result),
                )
              }
              disabled={result.entries.length === 0}
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
                void copyText("Copied stash refs.", formatStashRefs(result))
              }
              disabled={result.entries.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy refs
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied apply commands.",
                  formatStashCommand(result, "apply"),
                )
              }
              disabled={result.entries.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy apply
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(
                  "Copied pop commands.",
                  formatStashCommand(result, "pop"),
                )
              }
              disabled={result.entries.length === 0}
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy pop
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

          {result.entries.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <StatRow label="Stashes" value={result.summary.total} />
                <StatRow label="WIP" value={result.summary.byKind.wip} />
                <StatRow label="On branch" value={result.summary.byKind.branch} />
                <StatRow
                  label="Untracked"
                  value={result.summary.byKind.untracked}
                />
                <StatRow label="Custom" value={result.summary.byKind.custom} />
                {result.summary.branches.length > 0 && (
                  <StatRow
                    label="Branches"
                    value={result.summary.branches.join(", ")}
                  />
                )}
              </div>

              <Separator />

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Commit</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.entries.map((entry) => (
                      <StashRow key={entry.ref} entry={entry} />
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
