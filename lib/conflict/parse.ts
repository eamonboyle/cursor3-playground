import type {
  ConflictBlock,
  ConflictIssue,
  ConflictParseResult,
} from "./types"

const START_RE = /^<<<<<<<\s*(.*)$/
const SEPARATOR_RE = /^=======$/
const END_RE = /^>>>>>>>\s*(.*)$/

function countLines(text: string): number {
  if (!text) {
    return 0
  }
  return text.split(/\r?\n/).length
}

function pushIssue(
  issues: ConflictIssue[],
  kind: ConflictIssue["kind"],
  line: number,
  message: string,
) {
  issues.push({ kind, line, message })
}

export type ParseConflictOptions = {
  filepath?: string
}

export function conflictLocation(
  block: ConflictBlock,
  filepath?: string,
): string {
  const path = filepath?.trim()
  if (path) {
    return `${block.startLine}:${block.endLine}:${path}`
  }
  return `lines ${block.startLine}–${block.endLine}`
}

/**
 * Parse pasted file content for git merge conflict markers.
 */
export function parseConflictMarkers(
  text: string,
  _options: ParseConflictOptions = {},
): ConflictParseResult {
  const blocks: ConflictBlock[] = []
  const issues: ConflictIssue[] = []
  const warnings: string[] = []

  if (!text.trim()) {
    warnings.push(
      "Paste a file with `<<<<<<<`, `=======`, and `>>>>>>>` conflict markers.",
    )
    return {
      blocks,
      issues,
      summary: {
        conflictCount: 0,
        totalOursLines: 0,
        totalTheirsLines: 0,
        issueCount: 0,
      },
      warnings,
    }
  }

  const lines = text.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ""
    const startMatch = START_RE.exec(line)
    if (!startMatch) {
      i++
      continue
    }

    const startLine = i + 1
    const oursLabel = startMatch[1]?.trim() ?? ""
    let separatorIndex = -1
    let endIndex = -1
    let theirsLabel = ""

    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j] ?? ""
      if (SEPARATOR_RE.test(candidate)) {
        separatorIndex = j
        break
      }
      if (START_RE.test(candidate) || END_RE.test(candidate)) {
        break
      }
    }

    if (separatorIndex === -1) {
      pushIssue(
        issues,
        "incomplete-block",
        startLine,
        "`<<<<<<<` without a matching `=======` separator.",
      )
      i++
      continue
    }

    for (let j = separatorIndex + 1; j < lines.length; j++) {
      const candidate = lines[j] ?? ""
      const endMatch = END_RE.exec(candidate)
      if (endMatch) {
        endIndex = j
        theirsLabel = endMatch[1]?.trim() ?? ""
        break
      }
      if (START_RE.test(candidate)) {
        break
      }
    }

    if (endIndex === -1) {
      pushIssue(
        issues,
        "incomplete-block",
        startLine,
        "`<<<<<<<` block missing closing `>>>>>>>` marker.",
      )
      i = separatorIndex + 1
      continue
    }

    const oursLines = lines.slice(i + 1, separatorIndex)
    const theirsLines = lines.slice(separatorIndex + 1, endIndex)
    const oursContent = oursLines.join("\n")
    const theirsContent = theirsLines.join("\n")

    blocks.push({
      index: blocks.length + 1,
      startLine,
      separatorLine: separatorIndex + 1,
      endLine: endIndex + 1,
      oursLabel,
      theirsLabel,
      oursLineCount: countLines(oursContent),
      theirsLineCount: countLines(theirsContent),
      oursContent,
      theirsContent,
    })

    i = endIndex + 1
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const lineNo = i + 1
    if (SEPARATOR_RE.test(line)) {
      const insideBlock = blocks.some(
        (b) => lineNo === b.separatorLine,
      )
      if (!insideBlock) {
        pushIssue(
          issues,
          "orphan-separator",
          lineNo,
          "Standalone `=======` line outside a conflict block.",
        )
      }
    }
    if (END_RE.test(line)) {
      const insideBlock = blocks.some((b) => lineNo === b.endLine)
      if (!insideBlock) {
        pushIssue(
          issues,
          "orphan-end",
          lineNo,
          "Standalone `>>>>>>>` marker without a matching `<<<<<<<`.",
        )
      }
    }
  }

  let totalOursLines = 0
  let totalTheirsLines = 0
  for (const block of blocks) {
    totalOursLines += block.oursLineCount
    totalTheirsLines += block.theirsLineCount
  }

  if (blocks.length === 0 && issues.length === 0) {
    warnings.push(
      "No conflict markers found. Expected lines like `<<<<<<< HEAD`, `=======`, and `>>>>>>> branch`.",
    )
  }

  if (issues.length > 0) {
    warnings.push(
      `${issues.length} malformed marker(s) detected — resolve incomplete blocks before committing.`,
    )
  }

  return {
    blocks,
    issues,
    summary: {
      conflictCount: blocks.length,
      totalOursLines,
      totalTheirsLines,
      issueCount: issues.length,
    },
    warnings,
  }
}

export function formatConflictMarkdown(
  result: ConflictParseResult,
  filepath?: string,
): string {
  if (result.blocks.length === 0) {
    return "_No merge conflicts found._"
  }

  const pathNote = filepath?.trim() ? ` in \`${filepath.trim()}\`` : ""
  const lines = [
    `**${result.summary.conflictCount}** conflict block(s)${pathNote}`,
    `Ours: **${result.summary.totalOursLines}** line(s) · Theirs: **${result.summary.totalTheirsLines}** line(s)`,
    "",
  ]

  for (const block of result.blocks) {
    const loc = conflictLocation(block, filepath)
    const ours = block.oursLabel || "ours"
    const theirs = block.theirsLabel || "theirs"
    lines.push(
      `### Block ${block.index} (\`${loc}\`)`,
      `- **${ours}** (${block.oursLineCount} lines) vs **${theirs}** (${block.theirsLineCount} lines)`,
      "",
    )
  }

  if (result.issues.length > 0) {
    lines.push("#### Marker issues", "")
    for (const issue of result.issues) {
      lines.push(`- Line ${issue.line}: ${issue.message}`)
    }
  }

  return lines.join("\n")
}

export function formatConflictCitations(
  result: ConflictParseResult,
  filepath?: string,
): string {
  const path = filepath?.trim()
  if (!path) {
    return ""
  }
  return result.blocks
    .map((block) => conflictLocation(block, path))
    .join("\n")
}

export function formatConflictLineRanges(
  result: ConflictParseResult,
): string {
  return result.blocks
    .map((block) => `${block.startLine}-${block.endLine}`)
    .join("\n")
}

export function formatResolvedContent(
  block: ConflictBlock,
  side: "ours" | "theirs",
): string {
  return side === "ours" ? block.oursContent : block.theirsContent
}
