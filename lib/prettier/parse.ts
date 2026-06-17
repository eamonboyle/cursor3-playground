import type {
  PrettierFileEntry,
  PrettierParseOptions,
  PrettierParseResult,
} from "./types"

/** [warn] path or [error] path from prettier --check */
const CHECK_FILE_RE = /^\[(?:warn|error)\]\s+(.+?)\s*$/

/** Summary line from prettier --check */
const CHECK_SUMMARY_RE =
  /^\[(?:warn|error)\]\s+Code style issues found in (\d+) files?/i

const ALL_FORMATTED_RE = /All matched files use Prettier code style/i

/** Plain file path (no leading bracket) */
const PATH_ONLY_RE = /^(?:\.\/)?[\w@./\-[\]()+\s]+\.\w[\w.]*$/

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\/+/, "").trim()
}

function matchesExtension(path: string, extensionFilter?: string): boolean {
  if (!extensionFilter?.trim()) {
    return true
  }
  const normalized = extensionFilter.trim().toLowerCase()
  const withDot = normalized.startsWith(".") ? normalized : `.${normalized}`
  return path.toLowerCase().endsWith(withDot)
}

function fileExtension(path: string): string {
  const base = path.split("/").pop() ?? path
  const dot = base.lastIndexOf(".")
  if (dot <= 0) {
    return "(no ext)"
  }
  return base.slice(dot).toLowerCase()
}

function applyFilters(
  files: PrettierFileEntry[],
  options: PrettierParseOptions,
): { files: PrettierFileEntry[]; skipped: number } {
  let skipped = 0
  const filtered = files.filter((entry) => {
    if (options.hideNodeModules && isNodeModulesPath(entry.path)) {
      skipped++
      return false
    }
    if (!matchesExtension(entry.path, options.extensionFilter)) {
      skipped++
      return false
    }
    return true
  })
  return { files: filtered, skipped }
}

function buildSummary(
  files: PrettierFileEntry[],
  allFormatted: boolean,
): PrettierParseResult["summary"] {
  const byExtension: Record<string, number> = {}
  for (const entry of files) {
    const ext = fileExtension(entry.path)
    byExtension[ext] = (byExtension[ext] ?? 0) + 1
  }
  return {
    fileCount: files.length,
    byExtension,
    allFormatted,
  }
}

/**
 * Parse pasted prettier --check, --list-different, or plain file path output.
 */
export function parsePrettierOutput(
  text: string,
  options: PrettierParseOptions = {},
): PrettierParseResult {
  const warnings: string[] = []
  const rawFiles: PrettierFileEntry[] = []
  const lines = text.split(/\r?\n/)
  let allFormatted = false
  let checkSummaryCount: number | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trimEnd()
    if (!trimmed) {
      continue
    }

    if (ALL_FORMATTED_RE.test(trimmed)) {
      allFormatted = true
      continue
    }

    const checkFile = CHECK_FILE_RE.exec(trimmed)
    if (checkFile) {
      const path = normalizePath(checkFile[1] ?? "")
      if (path && !CHECK_SUMMARY_RE.test(trimmed)) {
        rawFiles.push({ path, sourceLine: i + 1, raw: trimmed })
      }
      continue
    }

    const summary = CHECK_SUMMARY_RE.exec(trimmed)
    if (summary) {
      checkSummaryCount = Number(summary[1])
      continue
    }

    if (trimmed === "Checking formatting...") {
      continue
    }

    if (PATH_ONLY_RE.test(trimmed)) {
      rawFiles.push({
        path: normalizePath(trimmed),
        sourceLine: i + 1,
        raw: trimmed,
      })
    }
  }

  const { files, skipped } = applyFilters(rawFiles, options)
  const summary = buildSummary(files, allFormatted && files.length === 0)

  if (!text.trim()) {
    warnings.push(
      "Paste output from `prettier --check`, `prettier --list-different`, or one file path per line.",
    )
  } else if (files.length === 0 && !allFormatted) {
    warnings.push(
      "No unformatted files found. Try pasting prettier --check output or a list of paths.",
    )
  } else {
    if (skipped > 0) {
      warnings.push(`Filtered ${skipped} file(s) by current options.`)
    }
    if (checkSummaryCount !== undefined && checkSummaryCount !== files.length) {
      warnings.push(
        `Prettier reported ${checkSummaryCount} file(s); ${files.length} remain after filters.`,
      )
    }
    if (allFormatted) {
      warnings.push("All matched files use Prettier code style.")
    }
  }

  return { files, summary, warnings }
}

export function formatPrettierPaths(result: PrettierParseResult): string {
  return result.files.map((f) => f.path).join("\n")
}

export function formatPrettierWriteCommand(
  result: PrettierParseResult,
  packageManager: "pnpm" | "npm" | "npx" = "pnpm",
): string {
  if (result.files.length === 0) {
    return ""
  }
  const paths = result.files.map((f) => `"${f.path}"`).join(" ")
  if (packageManager === "npx") {
    return `npx prettier --write ${paths}`
  }
  return `${packageManager} exec prettier --write ${paths}`
}

export function formatPrettierMarkdown(result: PrettierParseResult): string {
  if (result.summary.allFormatted && result.files.length === 0) {
    return "_All matched files use Prettier code style._"
  }
  if (result.files.length === 0) {
    return "_No unformatted files found._"
  }

  const { summary } = result
  const extParts = Object.entries(summary.byExtension)
    .sort((a, b) => b[1] - a[1])
    .map(([ext, count]) => `${ext}: ${count}`)
  const lines = [
    `**${summary.fileCount}** unformatted file(s)`,
    extParts.length ? `Extensions — ${extParts.join(", ")}` : "",
    "",
    ...result.files.map((f) => `- \`${f.path}\``),
  ].filter(Boolean)

  return lines.join("\n").trimEnd()
}
