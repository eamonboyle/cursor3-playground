import type { BuildError, BuildErrorKind, BuildParseResult } from "./types"

const ANSI_RE = /\x1b\[[0-9;]*m/g

/** Next.js / webpack: `./path/file.tsx:line:col` */
const FILE_LINE_COL_RE =
  /^(?:\.\/)?([\w@./\-[\]()+\s]+\.\w[\w.]*):(\d+):(\d+)\s*$/

/** Standalone file header: `./path/file.tsx` */
const FILE_HEADER_RE = /^(?:\.\/)?([\w@./\-[\]()+\s]+\.\w[\w.]*)$/

/** SWC caret annotation: `,-[path:line:col]` */
const SWC_CARET_RE = /,\-\[([^\]]+):(\d+):(\d+)\]/

/** Module not found: Can't resolve 'module' in 'dir' */
const MODULE_NOT_FOUND_RE =
  /Module not found: Can't resolve '([^']+)'(?: in '([^']+)')?/i

const TYPE_ERROR_RE = /^Type error:\s*(.+)$/i
const SYNTAX_ERROR_RE = /^Syntax error:\s*(.+)$/i
const ERROR_RE = /^Error:\s*(.+)$/i
const FAILED_COMPILE_RE = /^Failed to compile\.?$/i
const BUILD_FAILED_RE = /^> Build failed/i

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function normalizePath(path: string): string {
  return path.replace(/^\.\//, "").trim()
}

function emptyByKind(): Record<BuildErrorKind, number> {
  return {
    "type-error": 0,
    "module-not-found": 0,
    "compile-error": 0,
    "syntax-error": 0,
    other: 0,
  }
}

function emptyByFile(): Record<string, number> {
  return {}
}

function classifyKind(message: string, missingModule?: string): BuildErrorKind {
  if (missingModule) {
    return "module-not-found"
  }
  if (/^type error:/i.test(message)) {
    return "type-error"
  }
  if (/^syntax error:/i.test(message)) {
    return "syntax-error"
  }
  if (/module not found/i.test(message)) {
    return "module-not-found"
  }
  if (/failed to compile|build failed|webpack errors/i.test(message)) {
    return "compile-error"
  }
  return "other"
}

function normalizeMessage(message: string): string {
  return message.replace(TYPE_ERROR_RE, "$1").replace(SYNTAX_ERROR_RE, "$1").trim()
}

function errorKey(e: BuildError): string {
  const loc =
    e.path && e.line !== undefined
      ? `${e.path}:${e.line}:${e.column ?? 0}`
      : e.path ?? ""
  return `${loc}:${e.kind}:${e.message}`
}

function pushError(
  all: BuildError[],
  seen: Set<string>,
  unique: BuildError[],
  byKind: Record<BuildErrorKind, number>,
  byFile: Record<string, number>,
  error: BuildError,
) {
  all.push(error)
  const key = errorKey(error)
  if (!seen.has(key)) {
    seen.add(key)
    unique.push(error)
  }
  byKind[error.kind] = (byKind[error.kind] ?? 0) + 1
  if (error.path) {
    byFile[error.path] = (byFile[error.path] ?? 0) + 1
  }
}

function parseFileLineCol(
  line: string,
): Pick<BuildError, "path" | "line" | "column"> | undefined {
  const trimmed = stripAnsi(line.trim())
  const match = FILE_LINE_COL_RE.exec(trimmed)
  if (!match) {
    return undefined
  }
  const lineNum = Number(match[2])
  const column = Number(match[3])
  if (Number.isNaN(lineNum) || Number.isNaN(column)) {
    return undefined
  }
  return {
    path: normalizePath(match[1]?.trim() ?? ""),
    line: lineNum,
    column,
  }
}

function parseFileHeader(line: string): string | undefined {
  const trimmed = stripAnsi(line.trim())
  if (!trimmed || trimmed.includes(":")) {
    return undefined
  }
  if (!FILE_HEADER_RE.test(trimmed)) {
    return undefined
  }
  return normalizePath(trimmed)
}

function parseMessageLine(
  line: string,
  sourceLine: number,
  currentPath?: string,
): BuildError | undefined {
  const trimmed = stripAnsi(line.trimEnd())
  if (!trimmed) {
    return undefined
  }

  const moduleMatch = MODULE_NOT_FOUND_RE.exec(trimmed)
  if (moduleMatch) {
    const missingModule = moduleMatch[1]
    const inDir = moduleMatch[2]
    const path = currentPath ?? (inDir ? normalizePath(inDir) : undefined)
    return {
      path,
      kind: "module-not-found",
      module: missingModule,
      message: trimmed,
      sourceLine,
      raw: trimmed,
    }
  }

  const typeMatch = TYPE_ERROR_RE.exec(trimmed)
  if (typeMatch) {
    return {
      path: currentPath,
      kind: "type-error",
      message: typeMatch[1]?.trim() ?? trimmed,
      sourceLine,
      raw: trimmed,
    }
  }

  const syntaxMatch = SYNTAX_ERROR_RE.exec(trimmed)
  if (syntaxMatch) {
    return {
      path: currentPath,
      kind: "syntax-error",
      message: syntaxMatch[1]?.trim() ?? trimmed,
      sourceLine,
      raw: trimmed,
    }
  }

  const errorMatch = ERROR_RE.exec(trimmed)
  if (errorMatch) {
    const message = errorMatch[1]?.trim() ?? trimmed
    return {
      path: currentPath,
      kind: classifyKind(message),
      message,
      sourceLine,
      raw: trimmed,
    }
  }

  const swcMatch = SWC_CARET_RE.exec(trimmed)
  if (swcMatch) {
    const lineNum = Number(swcMatch[2])
    const column = Number(swcMatch[3])
    if (!Number.isNaN(lineNum) && !Number.isNaN(column)) {
      return {
        path: normalizePath(swcMatch[1]?.trim() ?? ""),
        line: lineNum,
        column,
        kind: currentPath ? "syntax-error" : "other",
        message: trimmed,
        sourceLine,
        raw: trimmed,
      }
    }
  }

  return undefined
}

export type ParseBuildOptions = {
  hideNodeModules?: boolean
}

export function errorLocation(e: BuildError): string {
  if (e.path && e.line !== undefined) {
    const col = e.column !== undefined ? `:${e.column}` : ""
    return `${e.path}:${e.line}${col}`
  }
  if (e.path) {
    return e.path
  }
  return `line ${e.sourceLine}`
}

/**
 * Parse pasted Next.js / webpack build output into structured compile errors.
 */
export function parseBuildOutput(
  text: string,
  options: ParseBuildOptions = {},
): BuildParseResult {
  const hideNodeModules = options.hideNodeModules ?? true
  const warnings: string[] = []
  const errors: BuildError[] = []
  const unique: BuildError[] = []
  const seen = new Set<string>()
  const byKind = emptyByKind()
  const byFile = emptyByFile()
  let skipped = 0

  const lines = text.split(/\r?\n/)
  let currentPath: string | undefined
  let pendingLocation: Pick<BuildError, "path" | "line" | "column"> | undefined

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const trimmed = stripAnsi(rawLine.trim())

    if (!trimmed || FAILED_COMPILE_RE.test(trimmed) || BUILD_FAILED_RE.test(trimmed)) {
      continue
    }

    const fileLoc = parseFileLineCol(rawLine)
    if (fileLoc?.path) {
      currentPath = fileLoc.path
      pendingLocation = fileLoc
      continue
    }

    const headerPath = parseFileHeader(rawLine)
    if (headerPath) {
      currentPath = headerPath
      pendingLocation = undefined
      continue
    }

    const parsed = parseMessageLine(rawLine, i + 1, currentPath)
    if (parsed) {
      const located = pendingLocation
        ? {
            ...parsed,
            path: parsed.path ?? pendingLocation.path,
            line: parsed.line ?? pendingLocation.line,
            column: parsed.column ?? pendingLocation.column,
          }
        : parsed

      pendingLocation = undefined

      if (
        located.path &&
        hideNodeModules &&
        isNodeModulesPath(located.path)
      ) {
        skipped++
        continue
      }

      pushError(errors, seen, unique, byKind, byFile, located)
      continue
    }

    pendingLocation = undefined
  }

  const filePaths = new Set<string>()
  for (const e of errors) {
    if (e.path) {
      filePaths.add(e.path)
    }
  }

  if (!text.trim()) {
    warnings.push(
      "Paste output from `pnpm build`, `next build`, or your CI build step.",
    )
  } else if (errors.length === 0) {
    warnings.push(
      "No build errors found. Expected lines like `./app/page.tsx:10:5` with `Type error:` or `Module not found:`.",
    )
  } else if (skipped > 0) {
    warnings.push(
      `Filtered ${skipped} error(s) under node_modules. Turn off the switch to include them.`,
    )
  }

  return {
    errors,
    unique,
    summary: {
      total: errors.length,
      byKind,
      byFile,
    },
    fileCount: filePaths.size,
    warnings,
  }
}

export function formatBuildMarkdown(result: BuildParseResult): string {
  if (result.errors.length === 0) {
    return "_No build errors found._"
  }

  const kindParts = (
    Object.entries(result.summary.byKind) as [BuildErrorKind, number][]
  )
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind}: ${count}`)

  const lines = [
    `**${result.summary.total}** error(s) across **${result.fileCount}** file(s)`,
    kindParts.length ? `Kinds — ${kindParts.join(", ")}` : "",
    "",
  ].filter(Boolean)

  for (const e of result.errors) {
    const loc = errorLocation(e)
    const mod = e.module ? ` (missing \`${e.module}\`)` : ""
    lines.push(`- [${e.kind}] \`${loc}\`${mod} — ${normalizeMessage(e.message)}`)
  }

  return lines.join("\n")
}

export function formatBuildPaths(result: BuildParseResult): string {
  const paths: string[] = []
  const seen = new Set<string>()
  for (const e of result.unique) {
    if (!e.path || e.line === undefined) {
      continue
    }
    const key = `${e.path}:${e.line}`
    if (!seen.has(key)) {
      seen.add(key)
      paths.push(key)
    }
  }
  return paths.join("\n")
}
