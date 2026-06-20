import type {
  CheckStatus,
  ChecksParseResult,
  ChecksSummary,
  CiCheck,
} from "./types"

const ANSI_RE = /\x1b\[[0-9;]*m/g
const URL_RE = /https?:\/\/\S+/
const ELAPSED_RE = /\b(\d+m\d+s|\d+[smh])\b/

const STATUS_SYMBOLS: Record<string, CheckStatus> = {
  X: "fail",
  x: "fail",
  "✗": "fail",
  "✘": "fail",
  "❌": "fail",
  "✓": "pass",
  "✔": "pass",
  "✅": "pass",
  "-": "skipped",
  "–": "skipped",
  "·": "skipped",
  "*": "pending",
  "⏳": "pending",
  "?": "unknown",
}

const STATUS_WORDS: Record<string, CheckStatus> = {
  pass: "pass",
  passed: "pass",
  success: "pass",
  successful: "pass",
  ok: "pass",
  fail: "fail",
  failed: "fail",
  failing: "fail",
  failure: "fail",
  error: "fail",
  errors: "fail",
  pending: "pending",
  queued: "pending",
  running: "pending",
  "in progress": "pending",
  skip: "skipped",
  skipped: "skipped",
  neutral: "skipped",
  cancel: "cancelled",
  cancelled: "cancelled",
  canceled: "cancelled",
}

const HEADLINE_RE =
  /^(some checks were not successful|all checks have passed|checks pending)/i

const SUMMARY_COUNTS_RE =
  /^(\d+)\s+cancelled,\s+(\d+)\s+failing,\s+(\d+)\s+successful,\s+(\d+)\s+skipped,\s+and\s+(\d+)\s+pending\s+checks?/i

const TABLE_HEADER_RE = /^\s*NAME\s+DESCRIPTION\s+ELAPSED\s+URL\s*$/i

/** CI / lint (pull_request) Failing after 1m */
const GH_ACTIONS_LINE_RE =
  /^(?:CI\s*\/\s*)?(.+)\s+(Failing|Successful|Skipped|Cancelled|Pending|In progress|Queued)(?:\s+(?:after|in)\s+(\d+m\d+s|\d+[smh]))?\.?$/i

/** lint (pull_request): fail */
const NAME_STATUS_RE =
  /^(.+?)\s*[:]\s*(pass|fail|pending|skip(?:ped)?|cancel(?:led|ed)?|success(?:ful)?|error|failure|running|queued)\s*$/i

/** gh pr checks table row */
const GH_TABLE_ROW_RE =
  /^([Xx✗✘❌✓✔✅\-–·*⏳?])\s+(.+)$/

type JsonCheck = {
  name?: string
  state?: string
  status?: string
  conclusion?: string
  description?: string
  link?: string
  url?: string
  detailsUrl?: string
  startedAt?: string
  completedAt?: string
}

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function emptySummary(): ChecksSummary {
  return {
    pass: 0,
    fail: 0,
    pending: 0,
    skipped: 0,
    cancelled: 0,
    unknown: 0,
  }
}

function statusFromWord(word: string): CheckStatus {
  const normalized = word.trim().toLowerCase()
  return STATUS_WORDS[normalized] ?? "unknown"
}

function statusFromSymbol(symbol: string): CheckStatus {
  return STATUS_SYMBOLS[symbol] ?? "unknown"
}

function statusFromGhState(state: string): CheckStatus {
  const normalized = state.trim().toUpperCase()
  switch (normalized) {
    case "SUCCESS":
    case "COMPLETED":
      return "pass"
    case "FAILURE":
    case "FAILED":
    case "ERROR":
    case "TIMED_OUT":
    case "ACTION_REQUIRED":
      return "fail"
    case "PENDING":
    case "IN_PROGRESS":
    case "QUEUED":
    case "REQUESTED":
    case "WAITING":
      return "pending"
    case "SKIPPED":
    case "NEUTRAL":
      return "skipped"
    case "CANCELLED":
    case "CANCELED":
    case "STALE":
      return "cancelled"
    default: {
      const fromWord = statusFromWord(normalized.toLowerCase())
      return fromWord === "unknown" ? "unknown" : fromWord
    }
  }
}

function buildSummary(checks: CiCheck[]): ChecksSummary {
  const summary = emptySummary()
  for (const check of checks) {
    summary[check.status]++
  }
  return summary
}

function pushCheck(
  checks: CiCheck[],
  seen: Set<string>,
  check: CiCheck,
): boolean {
  const key = `${check.name}:${check.status}:${check.url ?? ""}`
  if (seen.has(key)) {
    return false
  }
  seen.add(key)
  checks.push(check)
  return true
}

function extractUrl(text: string): { url?: string; rest: string } {
  const match = URL_RE.exec(text)
  if (!match) {
    return { rest: text }
  }
  const url = match[0]
  const rest = text.replace(url, " ").replace(/\s+/g, " ").trim()
  return { url, rest }
}

function extractElapsed(text: string): { elapsed?: string; rest: string } {
  const match = ELAPSED_RE.exec(text)
  if (!match) {
    return { rest: text }
  }
  const elapsed = match[1]
  const rest = text.replace(elapsed, " ").replace(/\s+/g, " ").trim()
  return { elapsed, rest }
}

function splitNameDescription(rest: string): {
  name: string
  description?: string
} {
  const trimmed = rest.trim()
  if (!trimmed) {
    return { name: "" }
  }

  const parts = trimmed.split(/\s{2,}/)
  if (parts.length >= 2) {
    return {
      name: parts[0]?.trim() ?? trimmed,
      description: parts.slice(1).join("  ").trim() || undefined,
    }
  }

  const processMatch =
    /^(.+?\([^)]+\))\s+(Process completed.+)$/i.exec(trimmed)
  if (processMatch) {
    return {
      name: processMatch[1]?.trim() ?? trimmed,
      description: processMatch[2]?.trim(),
    }
  }

  const statusMatch = /^(.+?)\s+(In progress|Skipped|Deployment has completed)$/i.exec(
    trimmed,
  )
  if (statusMatch) {
    return {
      name: statusMatch[1]?.trim() ?? trimmed,
      description: statusMatch[2]?.trim(),
    }
  }

  return { name: trimmed }
}

function parseGhTableRow(
  line: string,
  sourceLine: number,
): CiCheck | undefined {
  const trimmed = stripAnsi(line.trimEnd())
  const match = GH_TABLE_ROW_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const status = statusFromSymbol(match[1] ?? "")
  let rest = match[2]?.trim() ?? ""
  if (!rest) {
    return undefined
  }

  const { url, rest: withoutUrl } = extractUrl(rest)
  rest = withoutUrl
  const { elapsed, rest: withoutElapsed } = extractElapsed(rest)
  rest = withoutElapsed
  const { name, description } = splitNameDescription(rest)

  if (!name) {
    return undefined
  }

  return {
    name,
    status,
    description,
    elapsed,
    url,
    sourceLine,
    raw: trimmed,
  }
}

function parseGhActionsLine(
  line: string,
  sourceLine: number,
): CiCheck | undefined {
  const trimmed = stripAnsi(line.trim())
  const match = GH_ACTIONS_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const name = match[1]?.trim() ?? ""
  const statusWord = match[2] ?? ""
  const elapsed = match[3]

  if (!name) {
    return undefined
  }

  return {
    name,
    status: statusFromWord(statusWord),
    elapsed,
    sourceLine,
    raw: trimmed,
  }
}

function parseNameStatusLine(
  line: string,
  sourceLine: number,
): CiCheck | undefined {
  const trimmed = stripAnsi(line.trim())
  const match = NAME_STATUS_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const name = match[1]?.trim() ?? ""
  const statusWord = match[2] ?? ""
  if (!name) {
    return undefined
  }

  return {
    name,
    status: statusFromWord(statusWord),
    sourceLine,
    raw: trimmed,
  }
}

function parseJsonChecks(text: string): CiCheck[] | undefined {
  const trimmed = text.trim()
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return undefined
  }

  let items: JsonCheck[] = []
  if (Array.isArray(parsed)) {
    items = parsed as JsonCheck[]
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { checks?: JsonCheck[] }).checks)
  ) {
    items = (parsed as { checks: JsonCheck[] }).checks
  } else {
    return undefined
  }

  const checks: CiCheck[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item || typeof item !== "object") {
      continue
    }
    const name = item.name?.trim()
    if (!name) {
      continue
    }
    const state = item.state ?? item.status ?? item.conclusion ?? ""
    checks.push({
      name,
      status: statusFromGhState(state),
      description: item.description,
      url: item.link ?? item.url ?? item.detailsUrl,
      sourceLine: i + 1,
      raw: JSON.stringify(item),
    })
  }

  return checks.length > 0 ? checks : undefined
}

export type ParseChecksOptions = {
  hideSkipped?: boolean
}

/**
 * Parse pasted CI / PR check output (`gh pr checks`, GitHub Actions summaries, JSON).
 */
export function parseChecksOutput(
  text: string,
  options: ParseChecksOptions = {},
): ChecksParseResult {
  const hideSkipped = options.hideSkipped ?? true
  const warnings: string[] = []
  const checks: CiCheck[] = []
  const seen = new Set<string>()
  let headline: string | undefined
  let skipped = 0

  const trimmed = text.trim()
  if (!trimmed) {
    warnings.push(
      "Paste output from `gh pr checks`, a GitHub Actions summary, or `gh pr checks --json`.",
    )
    return {
      checks: [],
      summary: emptySummary(),
      warnings,
    }
  }

  const fromJson = parseJsonChecks(trimmed)
  if (fromJson) {
    for (const check of fromJson) {
      if (
        hideSkipped &&
        (check.status === "skipped" || check.status === "cancelled")
      ) {
        skipped++
        continue
      }
      pushCheck(checks, seen, check)
    }
    return {
      checks,
      summary: buildSummary(checks),
      warnings:
        skipped > 0
          ? [
              `Filtered ${skipped} skipped/cancelled check(s). Turn off the switch to include them.`,
            ]
          : [],
    }
  }

  const lines = text.split(/\r?\n/)
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const line = stripAnsi(rawLine.trimEnd())
    const sourceLine = i + 1

    if (!line.trim()) {
      continue
    }

    if (HEADLINE_RE.test(line.trim())) {
      headline = line.trim()
      continue
    }

    if (SUMMARY_COUNTS_RE.test(line.trim())) {
      continue
    }

    if (TABLE_HEADER_RE.test(line.trim())) {
      inTable = true
      continue
    }

    const tableRow = parseGhTableRow(line, sourceLine)
    if (tableRow) {
      inTable = true
      if (
        hideSkipped &&
        (tableRow.status === "skipped" || tableRow.status === "cancelled")
      ) {
        skipped++
        continue
      }
      pushCheck(checks, seen, tableRow)
      continue
    }

    if (inTable) {
      continue
    }

    const actionsLine = parseGhActionsLine(line, sourceLine)
    if (actionsLine) {
      if (
        hideSkipped &&
        (actionsLine.status === "skipped" ||
          actionsLine.status === "cancelled")
      ) {
        skipped++
        continue
      }
      pushCheck(checks, seen, actionsLine)
      continue
    }

    const nameStatus = parseNameStatusLine(line, sourceLine)
    if (nameStatus) {
      if (
        hideSkipped &&
        (nameStatus.status === "skipped" ||
          nameStatus.status === "cancelled")
      ) {
        skipped++
        continue
      }
      pushCheck(checks, seen, nameStatus)
    }
  }

  if (checks.length === 0) {
    warnings.push(
      "No checks found. Expected `gh pr checks` table rows, `CI / job (pull_request) Failing`, or `name: fail` lines.",
    )
  } else if (skipped > 0) {
    warnings.push(
      `Filtered ${skipped} skipped/cancelled check(s). Turn off the switch to include them.`,
    )
  }

  return {
    checks,
    summary: buildSummary(checks),
    headline,
    warnings,
  }
}

export function filterChecksByStatus(
  checks: CiCheck[],
  statuses: CheckStatus[],
): CiCheck[] {
  const allowed = new Set(statuses)
  return checks.filter((check) => allowed.has(check.status))
}

export function formatChecksMarkdown(result: ChecksParseResult): string {
  if (result.checks.length === 0) {
    return "_No checks found._"
  }

  const { summary } = result
  const parts = [
    summary.fail > 0 ? `**${summary.fail}** failing` : "",
    summary.pass > 0 ? `**${summary.pass}** passing` : "",
    summary.pending > 0 ? `**${summary.pending}** pending` : "",
    summary.skipped > 0 ? `**${summary.skipped}** skipped` : "",
  ].filter(Boolean)

  const lines = [
    result.headline ?? `CI checks — ${parts.join(", ")}`,
    "",
  ]

  for (const check of result.checks) {
    const elapsed = check.elapsed ? ` (${check.elapsed})` : ""
    const desc = check.description ? ` — ${check.description}` : ""
    const link = check.url ? ` [link](${check.url})` : ""
    lines.push(
      `- **${check.status}** \`${check.name}\`${elapsed}${desc}${link}`,
    )
  }

  return lines.join("\n")
}

export function formatFailingCheckNames(result: ChecksParseResult): string {
  const names: string[] = []
  const seen = new Set<string>()
  for (const check of result.checks) {
    if (check.status !== "fail") {
      continue
    }
    if (!seen.has(check.name)) {
      seen.add(check.name)
      names.push(check.name)
    }
  }
  return names.join("\n")
}

export function formatCheckUrls(result: ChecksParseResult): string {
  const urls: string[] = []
  const seen = new Set<string>()
  for (const check of result.checks) {
    if (!check.url || seen.has(check.url)) {
      continue
    }
    seen.add(check.url)
    urls.push(check.url)
  }
  return urls.join("\n")
}

export function formatRerunHints(result: ChecksParseResult): string {
  const failing = result.checks.filter((check) => check.status === "fail")
  if (failing.length === 0) {
    return ""
  }

  const lines = [
    "# Re-run failed checks locally before pushing again",
    "pnpm typecheck",
    "pnpm lint",
    "pnpm test",
    "pnpm build",
    "",
    "# GitHub CLI helpers",
    "gh pr checks",
    "gh run list --branch $(git branch --show-current)",
    "gh run rerun --failed",
  ]

  const urls = formatCheckUrls({
    ...result,
    checks: failing,
  })
  if (urls) {
    lines.push("", "# Failed job URLs", urls)
  }

  return lines.join("\n")
}

export function checkStatusLabel(status: CheckStatus): string {
  switch (status) {
    case "pass":
      return "pass"
    case "fail":
      return "fail"
    case "pending":
      return "pending"
    case "skipped":
      return "skipped"
    case "cancelled":
      return "cancelled"
    case "unknown":
      return "unknown"
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
