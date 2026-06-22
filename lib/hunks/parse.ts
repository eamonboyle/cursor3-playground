import type { DiffHunk, HunksParseResult } from "./types"

const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/

type MutableFile = {
  path: string
  oldPath?: string
  newPath?: string
  binary: boolean
  isNew: boolean
  isDeleted: boolean
  hunkIndex: number
}

function parseDiffGitLine(line: string): { oldPath?: string; newPath?: string } {
  const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
  if (!match) {
    return {}
  }
  return { oldPath: match[1], newPath: match[2] }
}

function pathFromHeader(line: string, prefix: "--- " | "+++ "): string | undefined {
  if (!line.startsWith(prefix)) {
    return undefined
  }
  const rest = line.slice(prefix.length).trim()
  if (rest === "/dev/null") {
    return undefined
  }
  const tab = rest.indexOf("\t")
  const raw = tab === -1 ? rest : rest.slice(0, tab)
  return raw.replace(/^(a|b)\//, "")
}

function displayPath(file: MutableFile): string {
  return file.newPath ?? file.oldPath ?? file.path
}

function parseHunkCount(value: string | undefined): number {
  if (value === undefined || value === "") {
    return 1
  }
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

function startFile(fromGit: { oldPath?: string; newPath?: string }): MutableFile {
  const oldPath = fromGit.oldPath
  const newPath = fromGit.newPath
  return {
    path: newPath ?? oldPath ?? "unknown",
    oldPath,
    newPath,
    binary: false,
    isNew: false,
    isDeleted: false,
    hunkIndex: 0,
  }
}

function pushHunk(
  hunks: DiffHunk[],
  file: MutableFile,
  header: {
    oldStart: number
    oldCount: number
    newStart: number
    newCount: number
    context?: string
    sourceLine: number
    additions: number
    deletions: number
  },
) {
  file.hunkIndex++
  hunks.push({
    path: displayPath(file),
    hunkIndex: file.hunkIndex,
    oldStart: header.oldStart,
    oldCount: header.oldCount,
    newStart: header.newStart,
    newCount: header.newCount,
    additions: header.additions,
    deletions: header.deletions,
    context: header.context,
    sourceLine: header.sourceLine,
    binary: file.binary,
    isNew: file.isNew,
    isDeleted: file.isDeleted,
  })
}

/**
 * Line range for Cursor citations — prefers the post-change (new) side.
 */
export function hunkCitationRange(hunk: DiffHunk): {
  startLine: number
  endLine: number
  path: string
} {
  if (hunk.isDeleted || hunk.newCount === 0) {
    const end =
      hunk.oldCount === 0 ? hunk.oldStart : hunk.oldStart + hunk.oldCount - 1
    return { startLine: hunk.oldStart, endLine: end, path: hunk.path }
  }

  const end =
    hunk.newCount === 0 ? hunk.newStart : hunk.newStart + hunk.newCount - 1
  return { startLine: hunk.newStart, endLine: end, path: hunk.path }
}

export function formatHunkCitation(hunk: DiffHunk): string {
  const { startLine, endLine, path } = hunkCitationRange(hunk)
  return `${startLine}:${endLine}:${path}`
}

/**
 * Parse unified diff output into per-hunk line ranges for review and Cursor citations.
 */
export function parseDiffHunks(text: string): HunksParseResult {
  const warnings: string[] = []
  const hunks: DiffHunk[] = []
  let current: MutableFile | null = null
  let pendingHeader:
    | {
        oldStart: number
        oldCount: number
        newStart: number
        newCount: number
        context?: string
        sourceLine: number
        additions: number
        deletions: number
      }
    | undefined

  const lines = text.split(/\r?\n/)

  function flushPendingHunk() {
    if (pendingHeader && current) {
      pushHunk(hunks, current, pendingHeader)
      pendingHeader = undefined
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const sourceLine = i + 1

    if (line.startsWith("diff --git ")) {
      flushPendingHunk()
      current = startFile(parseDiffGitLine(line))
      continue
    }

    if (!current) {
      continue
    }

    if (line.startsWith("new file mode")) {
      current.isNew = true
      continue
    }
    if (line.startsWith("deleted file mode")) {
      current.isDeleted = true
      continue
    }
    if (line.startsWith("rename from ")) {
      current.oldPath = line.slice("rename from ".length).trim()
      continue
    }
    if (line.startsWith("rename to ")) {
      current.newPath = line.slice("rename to ".length).trim()
      current.path = current.newPath
      continue
    }
    if (line.startsWith("Binary files ") && line.includes(" differ")) {
      current.binary = true
      continue
    }

    const oldHeader = pathFromHeader(line, "--- ")
    if (oldHeader !== undefined) {
      current.oldPath = oldHeader
      if (!current.newPath) {
        current.path = oldHeader
      }
      continue
    }

    const newHeader = pathFromHeader(line, "+++ ")
    if (newHeader !== undefined) {
      current.newPath = newHeader
      current.path = newHeader
      continue
    }

    const hunkMatch = HUNK_HEADER_RE.exec(line)
    if (hunkMatch) {
      flushPendingHunk()
      const context = hunkMatch[5]?.trim()
      pendingHeader = {
        oldStart: Number(hunkMatch[1]),
        oldCount: parseHunkCount(hunkMatch[2]),
        newStart: Number(hunkMatch[3]),
        newCount: parseHunkCount(hunkMatch[4]),
        context: context || undefined,
        sourceLine,
        additions: 0,
        deletions: 0,
      }
      continue
    }

    if (!pendingHeader) {
      continue
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      pendingHeader.additions++
      continue
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      pendingHeader.deletions++
    }
  }

  flushPendingHunk()

  if (!text.trim()) {
    warnings.push("Paste a unified diff to analyze hunks.")
  } else if (hunks.length === 0) {
    warnings.push(
      "No @@ hunk headers found. Paste output from git diff, git show, or a .patch file.",
    )
  }

  const filePaths = new Set<string>()
  let additions = 0
  let deletions = 0
  let binaryCount = 0

  for (const hunk of hunks) {
    filePaths.add(hunk.path)
    additions += hunk.additions
    deletions += hunk.deletions
    if (hunk.binary) {
      binaryCount++
    }
  }

  return {
    hunks,
    summary: {
      fileCount: filePaths.size,
      hunkCount: hunks.length,
      additions,
      deletions,
      binaryCount,
    },
    warnings,
  }
}

export function formatHunksMarkdown(result: HunksParseResult): string {
  if (result.hunks.length === 0) {
    return "_No hunks parsed._"
  }

  const { summary } = result
  const lines = [
    `**${summary.hunkCount}** hunk(s) across **${summary.fileCount}** file(s), **+${summary.additions}** / **-${summary.deletions}**`,
    "",
  ]

  let lastPath = ""
  for (const hunk of result.hunks) {
    if (hunk.path !== lastPath) {
      if (lastPath) {
        lines.push("")
      }
      lines.push(`### \`${hunk.path}\``)
      lastPath = hunk.path
    }
    const citation = formatHunkCitation(hunk)
    const ctx = hunk.context ? ` — ${hunk.context}` : ""
    lines.push(
      `- Hunk ${hunk.hunkIndex}: \`${citation}\` (+${hunk.additions}/-${hunk.deletions})${ctx}`,
    )
  }

  return lines.join("\n")
}

export function formatHunkCitations(result: HunksParseResult): string {
  return result.hunks
    .filter((h) => !h.binary)
    .map((h) => formatHunkCitation(h))
    .join("\n")
}

export function formatHunkPaths(result: HunksParseResult): string {
  const paths: string[] = []
  const seen = new Set<string>()
  for (const hunk of result.hunks) {
    if (hunk.binary) {
      continue
    }
    const citation = formatHunkCitation(hunk)
    if (!seen.has(citation)) {
      seen.add(citation)
      paths.push(citation)
    }
  }
  return paths.join("\n")
}
