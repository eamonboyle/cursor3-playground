import type {
  StatFileEntry,
  StatParseOptions,
  StatParseResult,
} from "./types"

/** ` path | 12 +++++-----` or ` path | Bin` */
const STAT_LINE_RE = /^ (.+?) \| (.+)$/

/** `10\t2\tpath` or `-\t-\tpath` */
const NUMSTAT_LINE_RE = /^(\d+|-)\t(\d+|-)\t(.+)$/

const SHORTSTAT_RE =
  /(\d+)\s+files?\s+changed(?:,\s*(\d+)\s+insertions?\(\+\))?(?:,\s*(\d+)\s+deletions?\(-\))?/i

const LOG_HEADER_RE =
  /^(commit [0-9a-f]{7,40}|Author:|Date:|Merge:|diff --git |index [0-9a-f]+|\+\+\+ |--- |\s*$)/i

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function matchesExtension(path: string, extensionFilter?: string): boolean {
  if (!extensionFilter?.trim()) {
    return true
  }
  const normalized = extensionFilter.trim().toLowerCase()
  const withDot = normalized.startsWith(".") ? normalized : `.${normalized}`
  return path.toLowerCase().endsWith(withDot)
}

function parseStatRight(
  right: string,
): Pick<StatFileEntry, "additions" | "deletions" | "binary"> {
  const trimmed = right.trim()
  if (trimmed.startsWith("Bin")) {
    return { additions: 0, deletions: 0, binary: true }
  }

  const pluses = (trimmed.match(/\+/g) ?? []).length
  const minuses = (trimmed.match(/-/g) ?? []).length
  return { additions: pluses, deletions: minuses, binary: false }
}

function parseStatLine(line: string, sourceLine: number): StatFileEntry | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || LOG_HEADER_RE.test(trimmed)) {
    return undefined
  }

  const match = STAT_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const path = match[1]?.trim()
  const right = match[2] ?? ""
  if (!path) {
    return undefined
  }

  const counts = parseStatRight(right)
  return {
    path,
    ...counts,
    exact: false,
    sourceLine,
    raw: trimmed,
  }
}

function parseNumstatLine(line: string, sourceLine: number): StatFileEntry | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || LOG_HEADER_RE.test(trimmed)) {
    return undefined
  }

  const match = NUMSTAT_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const addRaw = match[1] ?? ""
  const delRaw = match[2] ?? ""
  const path = match[3]?.trim()
  if (!path) {
    return undefined
  }

  const binary = addRaw === "-" && delRaw === "-"
  const additions = binary ? 0 : Number(addRaw)
  const deletions = binary ? 0 : Number(delRaw)

  if (!binary && (Number.isNaN(additions) || Number.isNaN(deletions))) {
    return undefined
  }

  return {
    path,
    additions,
    deletions,
    binary,
    exact: true,
    sourceLine,
    raw: trimmed,
  }
}

function parseShortstat(line: string): {
  fileCount?: number
  additions?: number
  deletions?: number
} {
  const match = SHORTSTAT_RE.exec(line)
  if (!match) {
    return {}
  }

  return {
    fileCount: Number(match[1]),
    additions: match[2] !== undefined ? Number(match[2]) : 0,
    deletions: match[3] !== undefined ? Number(match[3]) : 0,
  }
}

function filterFiles(
  files: StatFileEntry[],
  options: StatParseOptions,
): StatFileEntry[] {
  return files.filter((file) => {
    if (options.hideNodeModules && isNodeModulesPath(file.path)) {
      return false
    }
    if (!matchesExtension(file.path, options.extensionFilter)) {
      return false
    }
    return true
  })
}

function buildSummary(files: StatFileEntry[]): StatParseResult["summary"] {
  let additions = 0
  let deletions = 0
  let binaryCount = 0

  for (const file of files) {
    additions += file.additions
    deletions += file.deletions
    if (file.binary) {
      binaryCount++
    }
  }

  return {
    fileCount: files.length,
    additions,
    deletions,
    binaryCount,
  }
}

export function fileChurn(file: StatFileEntry): number {
  return file.additions + file.deletions
}

/**
 * Parse pasted `git diff --stat`, `--numstat`, or `--shortstat` output.
 */
export function parseDiffStatOutput(
  text: string,
  options: StatParseOptions = {},
): StatParseResult {
  const warnings: string[] = []
  const lines = text.split(/\r?\n/)

  let numstatHits = 0
  let statHits = 0
  const allFiles: StatFileEntry[] = []

  for (let i = 0; i < lines.length; i++) {
    const numstat = parseNumstatLine(lines[i] ?? "", i + 1)
    if (numstat) {
      allFiles.push(numstat)
      numstatHits++
    }
  }

  if (numstatHits === 0) {
    for (let i = 0; i < lines.length; i++) {
      const stat = parseStatLine(lines[i] ?? "", i + 1)
      if (stat) {
        allFiles.push(stat)
        statHits++
      }
    }
  }

  let reportedFileCount: number | undefined
  let reportedAdditions: number | undefined
  let reportedDeletions: number | undefined

  for (const line of lines) {
    const short = parseShortstat(line)
    if (short.fileCount !== undefined) {
      reportedFileCount = short.fileCount
      reportedAdditions = short.additions
      reportedDeletions = short.deletions
    }
  }

  const files = filterFiles(allFiles, options)
  const summary = buildSummary(files)
  summary.reportedFileCount = reportedFileCount
  summary.reportedAdditions = reportedAdditions
  summary.reportedDeletions = reportedDeletions

  let format: StatParseResult["format"] = "unknown"
  if (numstatHits > 0 && statHits > 0) {
    format = "mixed"
  } else if (numstatHits > 0) {
    format = "numstat"
  } else if (statHits > 0) {
    format = "stat"
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git diff --stat`, `git diff --numstat`, or `git show --stat` output to rank files by churn.",
    )
  } else if (files.length === 0) {
    warnings.push(
      "No file stats found. Try: git diff --stat main...HEAD or git diff --numstat main...HEAD",
    )
  } else {
    if (format === "stat") {
      warnings.push(
        "Counts from --stat bar graphs may be scaled for large diffs; use --numstat for exact +/−.",
      )
    }
    if (
      options.hideNodeModules &&
      allFiles.length > files.length
    ) {
      warnings.push(
        `Hid ${allFiles.length - files.length} node_modules path(s). Toggle the filter to include them.`,
      )
    }
    if (
      reportedFileCount !== undefined &&
      reportedFileCount !== summary.fileCount
    ) {
      warnings.push(
        `Summary reports ${reportedFileCount} file(s); showing ${summary.fileCount} after filters.`,
      )
    }
    if (
      reportedAdditions !== undefined &&
      reportedDeletions !== undefined &&
      format === "numstat" &&
      (reportedAdditions !== summary.additions ||
        reportedDeletions !== summary.deletions)
    ) {
      warnings.push(
        `Summary totals (+${reportedAdditions}/-${reportedDeletions}) differ from parsed rows (+${summary.additions}/-${summary.deletions}) after filters.`,
      )
    }
  }

  return { files, summary, format, warnings }
}

export function sortByChurn(files: StatFileEntry[]): StatFileEntry[] {
  return [...files].sort((a, b) => fileChurn(b) - fileChurn(a))
}

export function formatStatMarkdown(result: StatParseResult): string {
  if (result.files.length === 0) {
    return "_No file stats found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.fileCount}** file(s), **+${summary.additions}** / **-${summary.deletions}**`,
  ]
  if (summary.binaryCount > 0) {
    lines[0] += `, **${summary.binaryCount}** binary`
  }
  lines.push("")

  for (const file of sortByChurn(result.files)) {
    if (file.binary) {
      lines.push(`- \`${file.path}\` _(binary)_`)
    } else {
      lines.push(
        `- \`${file.path}\` (+${file.additions}/-${file.deletions}, churn ${fileChurn(file)})`,
      )
    }
  }

  return lines.join("\n")
}

export function formatStatPaths(result: StatParseResult): string {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const file of sortByChurn(result.files)) {
    if (!seen.has(file.path)) {
      seen.add(file.path)
      paths.push(file.path)
    }
  }
  return paths.join("\n")
}

export function formatStatPrScope(result: StatParseResult): string {
  if (result.files.length === 0) {
    return ""
  }

  const { summary } = result
  const lines = [
    "## Diff size",
    "",
    `${summary.fileCount} file(s), +${summary.additions} / -${summary.deletions}`,
    "",
    "### Largest changes",
    "",
  ]

  for (const file of sortByChurn(result.files).slice(0, 20)) {
    if (file.binary) {
      lines.push(`- \`${file.path}\` (binary)`)
    } else {
      lines.push(
        `- \`${file.path}\` (+${file.additions}/-${file.deletions})`,
      )
    }
  }

  return lines.join("\n").trimEnd()
}
