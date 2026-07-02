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
import {
  fileDisplayPath,
  formatChangesMarkdown,
  formatChangesPaths,
  parseChangesOutput,
} from "@/lib/changes/parse"
import { SAMPLE_STASH_LIST, SAMPLE_STASH_SHOW } from "@/lib/stash/defaults"
import {
  formatStashApplyCommands,
  formatStashMarkdown,
  formatStashPatchCommands,
  formatStashRefs,
  formatStashShowCommands,
  parseStashList,
} from "@/lib/stash/parse"
import type { StashEntry, StashKind } from "@/lib/stash/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

const KIND_VARIANT: Record<
  StashKind,
  "default" | "secondary" | "destructive" | "outline"
> = {
  wip: "default",
  on: "secondary",
  untracked: "outline",
  autostash: "secondary",
  unknown: "outline",
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

function StashRow({
  entry,
  onCopy,
}: {
  entry: StashEntry
  onCopy: (text: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs tabular-nums">{entry.ref}</TableCell>
      <TableCell>
        <Badge variant={KIND_VARIANT[entry.kind]} className="font-mono text-[0.65rem]">
          {entry.kind}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[10rem] truncate font-mono text-xs" title={entry.branch}>
        {entry.branch ?? "—"}
      </TableCell>
      <TableCell className="max-w-[16rem] truncate text-xs" title={entry.message}>
        {entry.message || "—"}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCopy(entry.ref)}
          aria-label={`Copy ${entry.ref}`}
        >
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function StashApp() {
  const [listInput, setListInput] = React.useState(SAMPLE_STASH_LIST)
  const [showInput, setShowInput] = React.useState(SAMPLE_STASH_SHOW)
  const [selectedRef, setSelectedRef] = React.useState("all")
  const [hideNodeModules, setHideNodeModules] = React.useState(true)

  const listResult = React.useMemo(() => parseStashList(listInput), [listInput])

  React.useEffect(() => {
    if (listResult.entries.length === 0) {
      setSelectedRef("all")
      return
    }
    if (
      selectedRef !== "all" &&
      !listResult.entries.some((entry) => entry.ref === selectedRef)
    ) {
      setSelectedRef(listResult.entries[0]?.ref ?? "all")
    }
  }, [listResult.entries, selectedRef])

  const filteredList = React.useMemo(() => {
    if (selectedRef === "all") {
      return listResult
    }
    return {
      ...listResult,
      entries: listResult.entries.filter((entry) => entry.ref === selectedRef),
    }
  }, [listResult, selectedRef])

  const showResult = React.useMemo(
    () =>
      parseChangesOutput(showInput, {
        hideNodeModules,
        statusFilter: "all",
        extensionFilter: "",
      }),
    [showInput, hideNodeModules],
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
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Archive01Icon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Git stash lab</h1>
            <p className="text-muted-foreground text-sm">
              Paste <code className="text-xs">git stash list</code> and optional{" "}
              <code className="text-xs">git stash show --name-status</code> — review
              saved work, copy apply/pop commands, and scope files for agent context.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant="outline">{listResult.summary.total} stash(es)</Badge>
          {showResult.summary.total > 0 ? (
            <Badge variant="outline">{showResult.summary.total} file(s) in show</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stash list</CardTitle>
          <CardDescription>
            Run <code className="text-xs">git stash list</code> to enumerate saved
            stashes with branch and message context.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="stash-list-input">git stash list</FieldLabel>
            <FieldContent>
              <Textarea
                id="stash-list-input"
                value={listInput}
                onChange={(e) => setListInput(e.target.value)}
                rows={8}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git stash list output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Field className="w-full sm:w-48">
              <FieldLabel htmlFor="stash-filter">Focus stash</FieldLabel>
              <Select value={selectedRef} onValueChange={setSelectedRef}>
                <SelectTrigger id="stash-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stashes</SelectItem>
                  {listResult.entries.map((entry) => (
                    <SelectItem key={entry.ref} value={entry.ref}>
                      {entry.ref}
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
                  setListInput(SAMPLE_STASH_LIST)
                  toast.message("Loaded stash list sample.")
                }}
              >
                List sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setListInput("")}
                disabled={!listInput}
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
                  void copyText("Copied stash refs.", formatStashRefs(filteredList))
                }
                disabled={filteredList.entries.length === 0}
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
                    "Copied git stash apply commands.",
                    formatStashApplyCommands(filteredList, "apply"),
                  )
                }
                disabled={filteredList.entries.length === 0}
              >
                Copy apply
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied git stash pop commands.",
                    formatStashApplyCommands(filteredList, "pop"),
                  )
                }
                disabled={filteredList.entries.length === 0}
              >
                Copy pop
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied show commands.",
                    formatStashShowCommands(filteredList),
                  )
                }
                disabled={filteredList.entries.length === 0}
              >
                Copy show cmds
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied patch commands.",
                    formatStashPatchCommands(filteredList),
                  )
                }
                disabled={filteredList.entries.length === 0}
              >
                Copy patch cmds
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied markdown report.",
                    formatStashMarkdown(filteredList),
                  )
                }
                disabled={filteredList.entries.length === 0}
              >
                Copy markdown
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stashes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredList.entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No stashes parsed. Paste list output or load the sample.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.entries.map((entry) => (
                    <StashRow
                      key={entry.ref}
                      entry={entry}
                      onCopy={(text) => void copyText("Copied ref.", text)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stash show</CardTitle>
          <CardDescription>
            Paste output from{" "}
            <code className="text-xs">git stash show --name-status stash@{"{N}"}</code>{" "}
            to list files touched by a stash.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="stash-show-input">git stash show</FieldLabel>
            <FieldContent>
              <Textarea
                id="stash-show-input"
                value={showInput}
                onChange={(e) => setShowInput(e.target.value)}
                rows={10}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                placeholder="Paste git stash show --name-status output here"
              />
            </FieldContent>
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="stash-hide-node-modules"
                checked={hideNodeModules}
                onCheckedChange={setHideNodeModules}
              />
              <FieldLabel htmlFor="stash-hide-node-modules" className="mb-0">
                Hide node_modules
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInput(SAMPLE_STASH_SHOW)
                  toast.message("Loaded stash show sample.")
                }}
              >
                Show sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInput("")}
                disabled={!showInput}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied changed paths.",
                    formatChangesPaths(showResult),
                  )
                }
                disabled={showResult.files.length === 0}
              >
                Copy paths
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  void copyText(
                    "Copied file markdown.",
                    formatChangesMarkdown(showResult),
                  )
                }
                disabled={showResult.files.length === 0}
              >
                Copy markdown
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResult.files.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files in stash</CardTitle>
            <CardDescription>
              Parsed from name-status output — added, modified, and deleted paths.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <StatRow label="Total files" value={showResult.summary.total} />
            <StatRow label="Added" value={showResult.summary.byStatus.added} />
            <StatRow label="Modified" value={showResult.summary.byStatus.modified} />
            <StatRow label="Deleted" value={showResult.summary.byStatus.deleted} />
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showResult.files.map((file, index) => (
                    <TableRow key={`${file.path}-${index}`}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[0.65rem]">
                          {file.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="max-w-[20rem] truncate font-mono text-xs"
                        title={fileDisplayPath(file)}
                      >
                        {fileDisplayPath(file)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {listResult.warnings.length > 0 || showResult.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {[...listResult.warnings, ...showResult.warnings].map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Tip: run{" "}
        <code className="rounded bg-muted px-1">git stash list</code> and{" "}
        <code className="rounded bg-muted px-1">
          git stash show --name-status stash@{"{0}"}
        </code>{" "}
        before resuming interrupted agent work.
      </p>
    </div>
  )
}
