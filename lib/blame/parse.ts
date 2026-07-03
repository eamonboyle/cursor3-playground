import type {
  BlameAuthorGroup,
  BlameLine,
  BlameLineRange,
  BlameParseOptions,
  BlameParseResult,
  BlameSummary,
} from "./types"

/** Standard git blame line: hash (author date time tz line) content */
const BLAME_LINE_RE =
  /^(\^?)([0-9a-f]+)\s+\((.+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})\s+(\d+)\)\s?(.*)$/

function shortHash(hash: string): string {
  return hash.length > 7 ? hash.slice(0, 7) : hash
}

function parseStandardLine(line: string, sourceLine: number): BlameLine | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed) {
    return undefined
  }

  const match = BLAME_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const hash = match[2] ?? ""
  const lineNum = Number(match[7])
  if (!hash || Number.isNaN(lineNum)) {
    return undefined
  }

  return {
    line: lineNum,
    hash,
    shortHash: shortHash(hash),
    author: (match[3] ?? "").trim(),
    date: match[4] ?? "",
    time: match[5] ?? "",
    timezone: match[6] ?? "",
    content: match[8] ?? "",
    isBoundary: (match[1] ?? "") === "^",
    sourceLine,
    raw: trimmed,
  }
}

type PorcelainState = {
  hash?: string
  author?: string
  filename?: string
  lineNum: number
}

function parsePorcelainBlock(
  block: string[],
  startSourceLine: number,
): { lines: BlameLine[]; filename?: string } {
  const lines: BlameLine[] = []
  let state: PorcelainState = { lineNum: 0 }
  let filename: string | undefined
  let sourceLine = startSourceLine

  for (const raw of block) {
    const trimmed = raw.trimEnd()
    if (!trimmed) {
      continue
    }

    if (/^[0-9a-f]{7,40}$/.test(trimmed) && !trimmed.startsWith("\t")) {
      state = { hash: trimmed, lineNum: state.lineNum }
      continue
    }

    if (trimmed.startsWith("author ")) {
      state.author = trimmed.slice("author ".length).trim()
      continue
    }

    if (trimmed.startsWith("filename ")) {
      state.filename = trimmed.slice("filename ".length).trim()
      filename = state.filename
      continue
    }

    if (trimmed.startsWith("\t") || trimmed.startsWith("	")) {
      if (!state.hash) {
        continue
      }
      state.lineNum++
      const content = trimmed.slice(1)
      lines.push({
        line: state.lineNum,
        hash: state.hash,
        shortHash: shortHash(state.hash),
        author: state.author ?? "unknown",
        date: "",
        time: "",
        timezone: "",
        content,
        isBoundary: false,
        sourceLine,
        raw: trimmed,
      })
    }

    sourceLine++
  }

  return { lines, filename }
}

function isPorcelainInput(text: string): boolean {
  return /^(?:[0-9a-f]{7,40}\n|author )/m.test(text.trim())
}

function parseInput(text: string): {
  lines: BlameLine[]
  filepath?: string
  warnings: string[]
} {
  const warnings: string[] = []

  if (isPorcelainInput(text)) {
    const blocks = text.replace(/\r\n/g, "\n").split(/(?=^[0-9a-f]{7,40}$)/m)
    const allLines: BlameLine[] = []
    let filepath: string | undefined
    let sourceOffset = 1

    for (const block of blocks) {
      if (!block.trim()) {
        continue
      }
      const parsed = parsePorcelainBlock(block.split("\n"), sourceOffset)
      allLines.push(...parsed.lines)
      if (parsed.filename) {
        filepath = parsed.filename
      }
      sourceOffset += block.split("\n").length
    }

    if (allLines.length === 0) {
      warnings.push(
        "Porcelain blame detected but no tab-prefixed content lines were found.",
      )
    }

    return { lines: allLines, filepath, warnings }
  }

  const parsed: BlameLine[] = []
  const inputLines = text.replace(/\r\n/g, "\n").split("\n")

  for (let i = 0; i < inputLines.length; i++) {
    const entry = parseStandardLine(inputLines[i] ?? "", i + 1)
    if (entry) {
      parsed.push(entry)
    }
  }

  if (!text.trim()) {
    warnings.push(
      "Paste git blame output (standard or --porcelain) for a single file.",
    )
  } else if (parsed.length === 0) {
    warnings.push(
      "No blame lines found. Try: git blame -l path/to/file.ts",
    )
  }

  return { lines: parsed, warnings }
}

function buildRanges(lines: BlameLine[]): BlameLineRange[] {
  if (lines.length === 0) {
    return []
  }

  const sorted = [...lines].sort((a, b) => a.line - b.line)
  const ranges: BlameLineRange[] = []
  let current: BlameLineRange | undefined

  for (const entry of sorted) {
    if (
      current &&
      current.hash === entry.hash &&
      entry.line === current.end + 1
    ) {
      current.end = entry.line
      continue
    }

    current = {
      start: entry.line,
      end: entry.line,
      hash: entry.hash,
      shortHash: entry.shortHash,
    }
    ranges.push(current)
  }

  return ranges
}

function buildAuthorGroups(lines: BlameLine[]): BlameAuthorGroup[] {
  const byAuthor = new Map<string, BlameLine[]>()

  for (const entry of lines) {
    const bucket = byAuthor.get(entry.author) ?? []
    bucket.push(entry)
    byAuthor.set(entry.author, bucket)
  }

  const groups: BlameAuthorGroup[] = []

  for (const [author, authorLines] of byAuthor) {
    const hashSet = new Set<string>()
    for (const entry of authorLines) {
      hashSet.add(entry.shortHash)
    }

    groups.push({
      author,
      lineCount: authorLines.length,
      ranges: buildRanges(authorLines),
      hashes: [...hashSet].sort(),
    })
  }

  return groups.sort((a, b) => b.lineCount - a.lineCount)
}

function buildSummary(lines: BlameLine[]): BlameSummary {
  const byAuthor: Record<string, number> = {}
  const hashes = new Set<string>()

  for (const entry of lines) {
    byAuthor[entry.author] = (byAuthor[entry.author] ?? 0) + 1
    hashes.add(entry.hash)
  }

  return {
    totalLines: lines.length,
    authorCount: Object.keys(byAuthor).length,
    uniqueCommits: hashes.size,
    byAuthor,
  }
}

function matchesAuthorFilter(author: string, filter?: string): boolean {
  if (!filter?.trim()) {
    return true
  }
  return author.toLowerCase().includes(filter.trim().toLowerCase())
}

/**
 * Parse pasted `git blame` or `git blame --porcelain` output for a single file.
 */
export function parseBlameOutput(
  text: string,
  options: BlameParseOptions = {},
): BlameParseResult {
  const { lines: parsed, filepath: detectedPath, warnings } = parseInput(text)
  const filepath = options.filepath?.trim() || detectedPath

  const filtered = parsed.filter((entry) =>
    matchesAuthorFilter(entry.author, options.authorFilter),
  )

  if (options.authorFilter?.trim() && filtered.length < parsed.length) {
    warnings.push(
      `Author filter "${options.authorFilter.trim()}" removed ${parsed.length - filtered.length} line(s).`,
    )
  }

  return {
    lines: filtered.sort((a, b) => a.line - b.line),
    groups: buildAuthorGroups(filtered),
    summary: buildSummary(filtered),
    filepath,
    warnings,
  }
}

export function blameCitation(
  filepath: string,
  startLine: number,
  endLine: number,
): string {
  const path = filepath.trim().replace(/\\/g, "/")
  const start = Math.max(1, Math.floor(startLine))
  const end = Math.max(start, Math.floor(endLine))
  return `\`\`\`${start}:${end}:${path}\n\`\`\``
}

export function formatBlameCitations(
  result: BlameParseResult,
  limit = 20,
): string {
  const filepath = result.filepath?.trim()
  if (!filepath) {
    return ""
  }

  const ranges: BlameLineRange[] = []
  for (const group of result.groups) {
    ranges.push(...group.ranges)
  }

  ranges.sort((a, b) => a.start - b.start)

  return ranges
    .slice(0, limit)
    .map((range) => blameCitation(filepath, range.start, range.end))
    .join("\n\n")
}

export function formatBlameAuthors(result: BlameParseResult): string {
  return result.groups
    .map((group) => `${group.author}\t${group.lineCount}`)
    .join("\n")
}

export function formatBlameHashes(result: BlameParseResult): string {
  const hashes = new Set<string>()
  for (const entry of result.lines) {
    hashes.add(entry.shortHash)
  }
  return [...hashes].sort().join("\n")
}

export function formatBlameMarkdown(result: BlameParseResult): string {
  const lines: string[] = []
  lines.push("## Git blame summary")
  lines.push("")
  lines.push(
    `- **${result.summary.totalLines}** line(s) · **${result.summary.authorCount}** author(s) · **${result.summary.uniqueCommits}** commit(s)`,
  )
  if (result.filepath) {
    lines.push(`- **File:** \`${result.filepath}\``)
  }
  lines.push("")

  if (result.groups.length > 0) {
    lines.push("### By author")
    for (const group of result.groups) {
      const rangeText = group.ranges
        .map((r) =>
          r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`,
        )
        .join(", ")
      lines.push(
        `- **${group.author}** (${group.lineCount} lines, ${group.hashes.join(", ")}): ${rangeText}`,
      )
    }
    lines.push("")
  }

  if (result.warnings.length > 0) {
    lines.push("### Warnings")
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`)
    }
  }

  return lines.join("\n").trim()
}
