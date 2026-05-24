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
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_COMMIT_MESSAGE } from "@/lib/commit/defaults"
import {
  formatCommitLintReport,
  parseCommitMessage,
} from "@/lib/commit/parse"
import { loadCommitPersisted, saveCommitPersisted } from "@/lib/commit/storage"
import type { CommitIssue } from "@/lib/commit/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  GitCommitIcon,
} from "@hugeicons/core-free-icons"

const EXAMPLES = [
  "feat(auth): add OAuth sign-in flow",
  "fix(cron): handle DST edge case in next-run preview",
  "chore(deps): bump date-fns to 4.3.0",
  "docs: document commit message lab in README",
] as const

function IssueBadge({ level }: { level: CommitIssue["level"] }) {
  const variant =
    level === "error"
      ? "destructive"
      : level === "warn"
        ? "secondary"
        : "outline"
  const label =
    level === "error" ? "Error" : level === "warn" ? "Warning" : "Note"
  return (
    <Badge variant={variant} className="w-fit text-[0.65rem] uppercase">
      {label}
    </Badge>
  )
}

function IssueRow({ issue }: { issue: CommitIssue }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
      <IssueBadge level={issue.level} />
      <span>{issue.message}</span>
      {issue.line ? (
        <span className="text-muted-foreground font-mono text-[0.7rem]">
          line {issue.line}
        </span>
      ) : null}
    </li>
  )
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

export function CommitApp() {
  const [draft, setDraft] = React.useState(SAMPLE_COMMIT_MESSAGE)
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    React.startTransition(() => {
      const loaded = loadCommitPersisted()
      if (loaded.draft.trim()) {
        setDraft(loaded.draft)
      }
      setReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveCommitPersisted({ draft })
  }, [draft])

  const result = React.useMemo(() => parseCommitMessage(draft), [draft])

  async function copyMessage() {
    if (!draft.trim()) {
      toast.error("Nothing to copy yet.")
      return
    }
    try {
      await navigator.clipboard.writeText(draft)
      toast.success("Copied commit message.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(formatCommitLintReport(result))
      toast.success("Copied lint report.")
    } catch {
      toast.error("Clipboard unavailable in this context.")
    }
  }

  function loadSample() {
    setDraft(SAMPLE_COMMIT_MESSAGE)
    toast.message("Loaded sample message.")
  }

  function clearDraft() {
    setDraft("")
  }

  const errors = result.issues.filter((i) => i.level === "error")
  const warnings = result.issues.filter((i) => i.level === "warn")
  const notes = result.issues.filter((i) => i.level === "info")

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={GitCommitIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Commit message lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Lint Conventional Commits before you push — type, scope, subject
              length, body wrap, and breaking-change footers.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Client-only</Badge>
          <Badge variant={result.valid ? "default" : "secondary"}>
            {result.valid ? "Valid header" : "Needs fixes"}
          </Badge>
          {result.breaking ? <Badge variant="destructive">Breaking</Badge> : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draft message</CardTitle>
          <CardDescription>
            First line is the header; blank line; then body and optional footer
            (e.g. BREAKING CHANGE).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="commit-draft">Message</FieldLabel>
            <FieldContent>
              <Textarea
                id="commit-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                className="font-mono text-[0.75rem] leading-relaxed"
                spellCheck={false}
                disabled={!ready}
              />
            </FieldContent>
          </Field>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <Button
                key={example}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto max-w-full py-1.5 text-left font-mono text-[0.7rem] whitespace-normal"
                onClick={() => setDraft(example)}
              >
                {example}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadSample}>
              Load sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearDraft}
              disabled={!draft}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Clear
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void copyMessage()}>
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Copy message
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parsed header</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatRow label="Type" value={result.type ?? "—"} />
          <StatRow label="Scope" value={result.scope ?? "—"} />
          <StatRow label="Subject" value={result.subject || "—"} />
          <StatRow label="Subject length" value={result.subjectLength} />
          <StatRow label="Body lines" value={result.bodyLineCount} />
          <Separator />
          <Button type="button" variant="outline" size="sm" onClick={() => void copyReport()}>
            Copy lint report
          </Button>
        </CardContent>
      </Card>

      {(errors.length > 0 || warnings.length > 0 || notes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issues</CardTitle>
            <CardDescription>
              {errors.length} error(s), {warnings.length} warning(s),{" "}
              {notes.length} note(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {result.issues.map((issue, index) => (
                <IssueRow
                  key={`${issue.level}-${issue.message}-${index}`}
                  issue={issue}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
