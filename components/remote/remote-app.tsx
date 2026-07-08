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
import { Textarea } from "@/components/ui/textarea"
import {
  SAMPLE_GIT_REMOTE_PLAIN,
  SAMPLE_GIT_REMOTE_VERBOSE,
} from "@/lib/remote/defaults"
import {
  filterRemoteEntries,
  formatRemoteFetchUrls,
  formatRemoteMarkdown,
  formatRemoteNames,
  formatRemoteRemoveCommands,
  formatRemoteSetUrlCommands,
  parseRemoteOutput,
  remoteGetUrlCommand,
  remoteListVerboseCommand,
  remotePruneFetchCommand,
  remoteSetUrlCommand,
} from "@/lib/remote/parse"
import type { RemoteEntry, RemoteFilter } from "@/lib/remote/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons"

const FILTER_OPTIONS: { value: RemoteFilter; label: string }[] = [
  { value: "all", label: "All remotes" },
  { value: "https", label: "HTTPS" },
  { value: "ssh", label: "SSH" },
  { value: "mismatch", label: "Fetch/push mismatch" },
  { value: "plain", label: "Name only" },
]

function protocolVariant(
  protocol: RemoteEntry["fetchProtocol"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (protocol) {
    case "https":
      return "default"
    case "ssh":
      return "secondary"
    case "git":
      return "outline"
    case "other":
      return "destructive"
    case undefined:
      return "outline"
    default: {
      const _exhaustive: never = protocol
      return _exhaustive
    }
  }
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

function RemoteRow({
  entry,
  onCopy,
}: {
  entry: RemoteEntry
  onCopy: (text: string) => void
}) {
  const protocol = entry.fetchProtocol ?? entry.pushProtocol

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{entry.name}</TableCell>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs" title={entry.fetchUrl}>
        {entry.fetchUrl ?? "—"}
      </TableCell>
      <TableCell className="max-w-[14rem] truncate font-mono text-xs" title={entry.pushUrl}>
        {entry.pushUrl ?? "—"}
      </TableCell>
      <TableCell>
        {protocol ? (
          <Badge variant={protocolVariant(protocol)} className="font-mono text-[0.65rem]">
            {protocol}
          </Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{entry.host ?? "—"}</TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs">
        {entry.repoPath ?? "—"}
      </TableCell>
      <TableCell>
        {entry.fetchPushMismatch ? (
          <Badge variant="destructive" className="font-mono text-[0.65rem]">
            mismatch
          </Badge>
        ) : (
          <Badge variant="outline" className="font-mono text-[0.65rem]">
            ok
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onCopy(entry.name)}
            aria-label={`Copy remote name ${entry.name}`}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          {entry.fetchUrl && entry.name !== "(url)" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onCopy(remoteGetUrlCommand(entry.name))}
              aria-label={`Copy get-url for ${entry.name}`}
              title="Copy git remote get-url"
            >
              <span className="font-mono text-[0.6rem]">url</span>
            </Button>
          ) : null}
          {entry.fetchUrl && entry.name !== "(url)" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                onCopy(remoteSetUrlCommand(entry.name, entry.fetchUrl!))
              }
              aria-label={`Copy set-url for ${entry.name}`}
              title="Copy git remote set-url"
            >
              <span className="font-mono text-[0.6rem]">set</span>
            </Button>
          ) : null}
          {entry.name !== "(url)" && entry.name !== "—" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onCopy(remotePruneFetchCommand(entry.name))}
              aria-label={`Copy fetch prune for ${entry.name}`}
              title="Copy git fetch --prune"
            >
              <span className="font-mono text-[0.6rem]">pr</span>
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function RemoteApp() {
  const [input, setInput] = React.useState(SAMPLE_GIT_REMOTE_VERBOSE)
  const [filter, setFilter] = React.useState<RemoteFilter>("all")

  const result = React.useMemo(() => parseRemoteOutput(input), [input])
  const visible = React.useMemo(
    () => filterRemoteEntries(result.entries, filter),
    [result.entries, filter],
  )

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
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Globe02Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Git remote lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git remote -v</code> output —
              group fetch and push URLs, detect HTTPS vs SSH, spot fetch/push
              mismatches, copy set-url and prune commands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="outline">{result.summary.total} remote(s)</Badge>
          {result.summary.mismatch > 0 ? (
            <Badge variant="destructive">
              {result.summary.mismatch} mismatch
            </Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Remote output</CardTitle>
          <CardDescription>
            Run <code className="text-xs">git remote -v</code> before fixing
            upstream URLs, adding a fork remote, or auditing SSH vs HTTPS
            remotes on a new machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="remote-input">Git remote log</FieldLabel>
            <FieldContent>
              <Textarea
                id="remote-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git remote -v output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-52">
              <FieldLabel htmlFor="remote-filter">Filter</FieldLabel>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as RemoteFilter)}
              >
                <SelectTrigger id="remote-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_REMOTE_VERBOSE)
                  toast.message("Loaded verbose remote sample.")
                }}
              >
                Verbose sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(SAMPLE_GIT_REMOTE_PLAIN)
                  toast.message("Loaded plain remote sample.")
                }}
              >
                Plain sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInput("")}
                disabled={!input}
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
                    "Copied remote names.",
                    formatRemoteNames(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
                Copy names
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied fetch URLs.",
                    formatRemoteFetchUrls(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy fetch URLs
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied remote -v command.",
                    remoteListVerboseCommand(),
                  )
                }
              >
                Copy remote -v
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied set-url commands.",
                    formatRemoteSetUrlCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy set-url
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied remove commands.",
                    formatRemoteRemoveCommands(result, { filter }),
                  )
                }
                disabled={visible.length === 0}
              >
                Copy remove
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatRemoteMarkdown(result),
                  )
                }
                disabled={result.entries.length === 0}
              >
                Copy markdown
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow label="Total remotes" value={result.summary.total} />
          <StatRow label="HTTPS remotes" value={result.summary.https} />
          <StatRow label="SSH remotes" value={result.summary.ssh} />
          <StatRow label="Fetch/push mismatch" value={result.summary.mismatch} />
          <StatRow label="Name-only rows" value={result.summary.plainNames} />
          <StatRow label="Detected format" value={result.format} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parsed remotes</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Each remote is grouped with fetch and push URLs, protocol, host, and repo path."
              : `Showing ${filter} remotes only.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No remote rows in this filter. Paste output or load a sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Remote</TableHead>
                    <TableHead>Fetch URL</TableHead>
                    <TableHead>Push URL</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Repo</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry) => (
                    <RemoteRow
                      key={`${entry.name}-${entry.sourceLine}`}
                      entry={entry}
                      onCopy={(text) => void copyText("Copied.", text)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {result.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {result.warnings.map((w, i) => (
                <li key={`${w}-${i}`}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Tip: pair with the{" "}
        <Link href="/branches" className="text-foreground underline">
          branches lab
        </Link>{" "}
        — run <code className="rounded bg-muted px-1">git branch -vv</code> to
        see which local branches track each remote before changing upstream
        URLs.
      </p>
    </div>
  )
}
