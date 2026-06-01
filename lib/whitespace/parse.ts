import type {
  IndentKind,
  InvisibleCharHit,
  LineEndingKind,
  WhitespaceIssue,
  WhitespaceParseResult,
  WhitespaceParseSummary,
} from "./types"

const INVISIBLE_CHARS: ReadonlyArray<{
  codePoint: number
  label: string
}> = [
  { codePoint: 0xfeff, label: "BOM (U+FEFF)" },
  { codePoint: 0x200b, label: "ZWSP (U+200B)" },
  { codePoint: 0x200c, label: "ZWNJ (U+200C)" },
  { codePoint: 0x200d, label: "ZWJ (U+200D)" },
  { codePoint: 0x2060, label: "WORD JOINER (U+2060)" },
  { codePoint: 0x00a0, label: "NBSP (U+00A0)" },
  { codePoint: 0x2028, label: "LINE SEPARATOR (U+2028)" },
  { codePoint: 0x2029, label: "PARAGRAPH SEPARATOR (U+2029)" },
]

const INVISIBLE_BY_CODE = new Map(
  INVISIBLE_CHARS.map((c) => [c.codePoint, c.label]),
)

function countLineEndings(text: string): {
  lf: number
  crlf: number
  cr: number
} {
  let lf = 0
  let crlf = 0
  let cr = 0

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === "\r") {
      if (text[i + 1] === "\n") {
        crlf++
        i++
      } else {
        cr++
      }
    } else if (ch === "\n") {
      lf++
    }
  }

  return { lf, crlf, cr }
}

function dominantLineEnding(counts: {
  lf: number
  crlf: number
  cr: number
}): LineEndingKind {
  const kinds = [
    counts.lf > 0,
    counts.crlf > 0,
    counts.cr > 0,
  ].filter(Boolean).length

  if (kinds > 1) {
    return "none"
  }
  if (counts.crlf > 0) {
    return "crlf"
  }
  if (counts.lf > 0) {
    return "lf"
  }
  if (counts.cr > 0) {
    return "cr"
  }
  return "none"
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
}

function detectIndent(lines: string[]): {
  indent: IndentKind
  spaceIndentLines: number
  tabIndentLines: number
} {
  let spaceIndentLines = 0
  let tabIndentLines = 0

  for (const line of lines) {
    if (!line.trim()) {
      continue
    }
    if (line.startsWith("\t")) {
      tabIndentLines++
    } else if (/^ +/.test(line)) {
      spaceIndentLines++
    }
  }

  let indent: IndentKind = "none"
  if (spaceIndentLines > 0 && tabIndentLines > 0) {
    indent = "mixed"
  } else if (tabIndentLines > 0) {
    indent = "tabs"
  } else if (spaceIndentLines > 0) {
    indent = "spaces"
  }

  return { indent, spaceIndentLines, tabIndentLines }
}

function scanInvisibleChars(text: string): InvisibleCharHit[] {
  const hits: InvisibleCharHit[] = []
  const lines = splitLines(text)

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? ""
    for (let col = 0; col < line.length; col++) {
      const codePoint = line.codePointAt(col)
      if (codePoint === undefined) {
        continue
      }
      const label = INVISIBLE_BY_CODE.get(codePoint)
      if (label) {
        hits.push({
          line: lineIndex + 1,
          column: col + 1,
          codePoint,
          label,
        })
      }
      if (codePoint > 0xffff) {
        col++
      }
    }
  }

  return hits
}

function lineEndingLabel(kind: LineEndingKind): string {
  switch (kind) {
    case "lf":
      return "LF (Unix)"
    case "crlf":
      return "CRLF (Windows)"
    case "cr":
      return "CR (classic Mac)"
    case "none":
      return "mixed or none"
  }
}

/**
 * Analyze pasted text for line endings, trailing whitespace, indent style,
 * invisible Unicode characters, and final-newline hygiene.
 */
export function parseWhitespaceScan(text: string): WhitespaceParseResult {
  const warnings: string[] = []
  const issues: WhitespaceIssue[] = []

  const lineEndingCounts = countLineEndings(text)
  const lineEnding = dominantLineEnding(lineEndingCounts)
  const lines = splitLines(text)
  const lineCount = lines.length

  const { indent, spaceIndentLines, tabIndentLines } = detectIndent(lines)

  const trailingLines: number[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    if (line.length > 0 && /\s$/.test(line)) {
      trailingLines.push(i + 1)
    }
  }

  const invisibleHits = scanInvisibleChars(text)

  const hasFinalNewline = /\n$/.test(text.replace(/\r\n/g, "\n"))
  const endsWithBlankLine =
    lineCount > 1 && (lines[lineCount - 1] ?? "") === ""

  if (!text.trim()) {
    warnings.push(
      "Paste a file snippet, diff hunk, or copied source to scan for whitespace issues.",
    )
  }

  const endingKinds = [
    lineEndingCounts.lf > 0,
    lineEndingCounts.crlf > 0,
    lineEndingCounts.cr > 0,
  ].filter(Boolean).length

  if (endingKinds > 1) {
    issues.push({
      kind: "mixed-line-endings",
      message: "Mixed line endings detected",
      detail: `LF: ${lineEndingCounts.lf}, CRLF: ${lineEndingCounts.crlf}, CR: ${lineEndingCounts.cr}`,
    })
  }

  if (indent === "mixed") {
    issues.push({
      kind: "mixed-indent",
      message: "Mixed tabs and spaces for indentation",
      detail: `${tabIndentLines} tab-indented line(s), ${spaceIndentLines} space-indented line(s)`,
    })
  }

  for (const lineNum of trailingLines) {
    issues.push({
      kind: "trailing-whitespace",
      line: lineNum,
      message: `Trailing whitespace on line ${lineNum}`,
    })
  }

  for (const hit of invisibleHits) {
    issues.push({
      kind: "invisible-char",
      line: hit.line,
      column: hit.column,
      message: `${hit.label} at line ${hit.line}, column ${hit.column}`,
      detail: `U+${hit.codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
    })
  }

  if (text.length > 0 && !hasFinalNewline) {
    issues.push({
      kind: "missing-final-newline",
      message: "File does not end with a newline (POSIX text file convention)",
    })
  }

  if (endsWithBlankLine) {
    issues.push({
      kind: "final-newline-only",
      line: lineCount,
      message: "Extra blank line at end of file",
    })
  }

  const summary: WhitespaceParseSummary = {
    lineCount,
    lineEnding,
    lineEndingCounts,
    trailingWhitespaceLines: trailingLines.length,
    indent,
    spaceIndentLines,
    tabIndentLines,
    invisibleCharCount: invisibleHits.length,
    hasFinalNewline,
    endsWithBlankLine,
  }

  if (text.trim() && issues.length === 0) {
    warnings.push("No whitespace issues detected in this snippet.")
  }

  return {
    summary,
    issues,
    invisibleHits,
    warnings,
  }
}

export function formatWhitespaceScanMarkdown(
  result: WhitespaceParseResult,
): string {
  const { summary, issues } = result
  const lines = [
    "## Whitespace scan",
    "",
    `- **Lines:** ${summary.lineCount}`,
    `- **Line endings:** ${lineEndingLabel(summary.lineEnding)} (LF ${summary.lineEndingCounts.lf}, CRLF ${summary.lineEndingCounts.crlf}, CR ${summary.lineEndingCounts.cr})`,
    `- **Indent:** ${summary.indent}`,
    `- **Trailing whitespace lines:** ${summary.trailingWhitespaceLines}`,
    `- **Invisible characters:** ${summary.invisibleCharCount}`,
    `- **Final newline:** ${summary.hasFinalNewline ? "yes" : "no"}`,
    "",
  ]

  if (issues.length === 0) {
    lines.push("_No issues found._")
  } else {
    lines.push(`### Issues (${issues.length})`, "")
    for (const issue of issues) {
      const loc =
        issue.line !== undefined
          ? issue.column !== undefined
            ? ` (line ${issue.line}, col ${issue.column})`
            : ` (line ${issue.line})`
          : ""
      lines.push(`- ${issue.message}${loc}`)
      if (issue.detail) {
        lines.push(`  - ${issue.detail}`)
      }
    }
  }

  return lines.join("\n")
}

export function formatWhitespaceIssueLines(
  result: WhitespaceParseResult,
): string {
  const rows: string[] = []
  for (const issue of result.issues) {
    if (issue.line !== undefined) {
      const col =
        issue.column !== undefined ? `:${issue.column}` : ""
      rows.push(`${issue.line}${col}\t${issue.message}`)
    }
  }
  return rows.join("\n")
}
