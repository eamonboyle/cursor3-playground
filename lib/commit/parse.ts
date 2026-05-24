import type { CommitIssue, CommitParseResult, CommitType } from "./types"

const COMMIT_TYPES: readonly CommitType[] = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const

const SUBJECT_SOFT_MAX = 50
const SUBJECT_HARD_MAX = 72
const BODY_LINE_MAX = 72

const HEADER_RE = /^([a-z]+)(?:\(([^)]+)\))?(!)?: (.+)$/

function isCommitType(value: string): value is CommitType {
  return (COMMIT_TYPES as readonly string[]).includes(value)
}

function splitSections(text: string): {
  headerLine: string
  bodyLines: string[]
  footerLines: string[]
} {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const headerLine = lines[0] ?? ""

  if (lines.length <= 1 || lines[1]?.trim() !== "") {
    return { headerLine, bodyLines: [], footerLines: [] }
  }

  const rest = lines.slice(2)
  const footerBlank = rest.findIndex((line) => line.trim() === "")

  if (footerBlank === -1) {
    return { headerLine, bodyLines: rest, footerLines: [] }
  }

  const bodyLines = rest.slice(0, footerBlank)
  const footerLines = rest
    .slice(footerBlank + 1)
    .filter((line) => line.length > 0)

  return { headerLine, bodyLines, footerLines }
}

function hasBreakingFooter(footerLines: string[]): boolean {
  return footerLines.some((line) =>
    /^BREAKING[- ]CHANGE:/i.test(line.trim()),
  )
}

/**
 * Lint a commit message against Conventional Commits and common git subject rules.
 */
export function parseCommitMessage(text: string): CommitParseResult {
  const issues: CommitIssue[] = []
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      valid: false,
      breaking: false,
      subject: "",
      body: "",
      footer: "",
      subjectLength: 0,
      bodyLineCount: 0,
      issues: [
        { level: "warn", message: "Paste or type a commit message to lint." },
      ],
    }
  }

  const { headerLine, bodyLines, footerLines } = splitSections(trimmed)
  const body = bodyLines.join("\n")
  const footer = footerLines.join("\n")
  const match = HEADER_RE.exec(headerLine.trim())

  if (!match) {
    issues.push({
      level: "error",
      message:
        "First line must match `type(scope)!: subject` — e.g. `feat(auth): add sign-in flow`.",
      line: 1,
    })
    return {
      valid: false,
      breaking: hasBreakingFooter(footerLines),
      subject: headerLine.trim(),
      body,
      footer,
      subjectLength: headerLine.trim().length,
      bodyLineCount: bodyLines.length,
      issues,
    }
  }

  const typeRaw = match[1]
  const scope = match[2]?.trim()
  const breakingMarker = Boolean(match[3])
  const subject = match[4].trim()
  const breaking =
    breakingMarker ||
    hasBreakingFooter(footerLines) ||
    subject.includes("BREAKING CHANGE:")

  if (!isCommitType(typeRaw)) {
    issues.push({
      level: "error",
      message: `Unknown type \`${typeRaw}\`. Use one of: ${COMMIT_TYPES.join(", ")}.`,
      line: 1,
    })
  }

  if (!subject) {
    issues.push({
      level: "error",
      message: "Subject is empty after the colon.",
      line: 1,
    })
  }

  const subjectLength = subject.length
  if (subjectLength > SUBJECT_HARD_MAX) {
    issues.push({
      level: "error",
      message: `Subject is ${subjectLength} characters; keep it at or below ${SUBJECT_HARD_MAX}.`,
      line: 1,
    })
  } else if (subjectLength > SUBJECT_SOFT_MAX) {
    issues.push({
      level: "warn",
      message: `Subject is ${subjectLength} characters; ${SUBJECT_SOFT_MAX} or fewer reads better in git log.`,
      line: 1,
    })
  }

  if (subject.endsWith(".")) {
    issues.push({
      level: "warn",
      message: "Subject should not end with a period.",
      line: 1,
    })
  }

  if (subject.length > 0 && /^[A-Z]/.test(subject)) {
    issues.push({
      level: "info",
      message: "Subject usually starts lowercase (imperative mood).",
      line: 1,
    })
  }

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i] ?? ""
    if (line.length > BODY_LINE_MAX) {
      issues.push({
        level: "warn",
        message: `Body line ${i + 2} is ${line.length} characters; wrap at ${BODY_LINE_MAX}.`,
        line: i + 2,
      })
    }
  }

  const rawLines = text.replace(/\r\n/g, "\n").split("\n")
  if (rawLines.length > 1 && rawLines[1]?.trim() !== "") {
    issues.push({
      level: "warn",
      message: "Leave a blank line between subject and body.",
      line: 2,
    })
  }

  const hasErrors = issues.some((issue) => issue.level === "error")

  return {
    valid: !hasErrors && Boolean(subject),
    type: isCommitType(typeRaw) ? typeRaw : undefined,
    scope: scope || undefined,
    breaking,
    subject,
    body,
    footer,
    subjectLength,
    bodyLineCount: bodyLines.length,
    issues,
  }
}

export function formatCommitLintReport(result: CommitParseResult): string {
  const lines: string[] = []
  const status = result.valid ? "pass" : "fail"
  lines.push(`Commit lint: **${status}**`)

  if (result.type) {
    const scope = result.scope ? `(${result.scope})` : ""
    const bang = result.breaking ? "!" : ""
    lines.push(`Header: \`${result.type}${scope}${bang}: ${result.subject}\``)
  }

  if (result.issues.length === 0) {
    lines.push("")
    lines.push("_No issues found._")
    return lines.join("\n")
  }

  lines.push("")
  for (const issue of result.issues) {
    const prefix =
      issue.level === "error" ? "✗" : issue.level === "warn" ? "!" : "·"
    const loc = issue.line ? ` (line ${issue.line})` : ""
    lines.push(`${prefix} ${issue.message}${loc}`)
  }
  return lines.join("\n")
}
