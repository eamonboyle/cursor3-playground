import type {
  CitationBlock,
  CitationBuildInput,
  CitationParseResult,
} from "./types"

/** Ripgrep / grep -n: path:line[:column]:rest */
const RG_LINE_RE = /^(.*?):(\d+)(?::(\d+))?:\s*(.*)$/

const CITATION_FENCE_RE =
  /^```(\d+):(\d+):([^\n`]+)\n([\s\S]*?)```$/gm

function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, "/")
}

function validateLines(
  startLine: number,
  endLine: number,
  warnings: string[],
  context: string,
): boolean {
  if (!Number.isInteger(startLine) || startLine < 1) {
    warnings.push(`${context}: start line must be a positive integer.`)
    return false
  }
  if (!Number.isInteger(endLine) || endLine < 1) {
    warnings.push(`${context}: end line must be a positive integer.`)
    return false
  }
  if (startLine > endLine) {
    warnings.push(
      `${context}: start line (${startLine}) is greater than end line (${endLine}).`,
    )
    return false
  }
  return true
}

function validateFilepath(filepath: string, warnings: string[], context: string): boolean {
  const path = normalizePath(filepath)
  if (!path) {
    warnings.push(`${context}: filepath is empty.`)
    return false
  }
  if (path.includes("`")) {
    warnings.push(`${context}: filepath must not contain backticks.`)
    return false
  }
  return true
}

/**
 * Build a Cursor-style code citation fence.
 */
export function buildCitation(input: CitationBuildInput): string {
  const filepath = normalizePath(input.filepath)
  const startLine = Math.max(1, Math.floor(input.startLine))
  const endLine = Math.max(startLine, Math.floor(input.endLine))
  const header = `\`\`\`${startLine}:${endLine}:${filepath}`
  const code = (input.code ?? "").replace(/\s+$/, "")
  if (!code) {
    return `${header}\n\`\`\``
  }
  return `${header}\n${code}\n\`\`\``
}

function parseRipgrepLine(
  line: string,
  sourceLine: number,
): CitationBlock | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed.startsWith("```")) {
    return undefined
  }

  const rg = RG_LINE_RE.exec(trimmed)
  if (!rg) {
    return undefined
  }

  const filepath = normalizePath(rg[1] ?? "")
  const lineNum = Number(rg[2])
  if (
    !filepath ||
    filepath.includes("`") ||
    Number.isNaN(lineNum) ||
    lineNum < 1
  ) {
    return undefined
  }

  const content = (rg[4] ?? "").trimEnd()
  return {
    filepath,
    startLine: lineNum,
    endLine: lineNum,
    code: content,
    sourceLine,
    raw: trimmed,
  }
}

function parseCitationFences(text: string): CitationBlock[] {
  const citations: CitationBlock[] = []
  const re = new RegExp(CITATION_FENCE_RE.source, "gm")
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const startLine = Number(match[1])
    const endLine = Number(match[2])
    const filepath = normalizePath(match[3] ?? "")
    const code = (match[4] ?? "").replace(/\n$/, "")
    citations.push({
      filepath,
      startLine,
      endLine,
      code,
    })
  }
  return citations
}

function dedupeKey(c: CitationBlock): string {
  return `${c.filepath}:${c.startLine}:${c.endLine}:${c.code}`
}

/**
 * Scan pasted text for Cursor citation fences and ripgrep path:line rows.
 */
export function parseCitationScan(text: string): CitationParseResult {
  const warnings: string[] = []
  const citations: CitationBlock[] = []
  const seen = new Set<string>()

  for (const block of parseCitationFences(text)) {
    const key = dedupeKey(block)
    if (!seen.has(key)) {
      seen.add(key)
      citations.push(block)
    }
    const ctx = `\`${block.filepath}\` ${block.startLine}:${block.endLine}`
    validateFilepath(block.filepath, warnings, ctx)
    validateLines(block.startLine, block.endLine, warnings, ctx)
  }

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const fromRg = parseRipgrepLine(lines[i] ?? "", i + 1)
    if (!fromRg) {
      continue
    }
    const key = dedupeKey(fromRg)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    citations.push(fromRg)
  }

  if (!text.trim()) {
    warnings.push(
      "Paste ripgrep output (path:line:…) or an existing ```start:end:filepath citation block.",
    )
  } else if (citations.length === 0) {
    warnings.push(
      "No citations found. Try rg -n or paste a ```12:15:lib/foo.ts fenced block.",
    )
  }

  return { citations, warnings }
}

export function formatCitationScanMarkdown(result: CitationParseResult): string {
  if (result.citations.length === 0) {
    return "_No citations found._"
  }

  const lines = [`**${result.citations.length}** citation(s)`, ""]
  for (const c of result.citations) {
    lines.push(
      `- \`${c.filepath}\` **${c.startLine}–${c.endLine}** (${c.endLine - c.startLine + 1} line(s))`,
    )
  }
  return lines.join("\n")
}

export function formatCitationScanBlocks(result: CitationParseResult): string {
  return result.citations
    .map((c) =>
      buildCitation({
        filepath: c.filepath,
        startLine: c.startLine,
        endLine: c.endLine,
        code: c.code || undefined,
      }),
    )
    .join("\n\n")
}
