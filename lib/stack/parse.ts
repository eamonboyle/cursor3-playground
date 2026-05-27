import type { StackFrame, StackParseResult } from "./types"

const V8_PAREN_RE =
  /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+)(?::(\d+))?\)?\s*$/
const V8_BARE_RE = /^\s*at\s+(.+?):(\d+)(?::(\d+))?\s*$/
const PYTHON_RE =
  /^\s*File\s+"(.+?)",\s+line\s+(\d+)(?:,\s+in\s+(.+))?\s*$/
const RUST_RE = /^\s*-->\s+(.+?):(\d+):(\d+)\s*$/
const PLAIN_RE = /^\s*(.+?):(\d+)(?::(\d+))?\s*$/

function normalizePath(raw: string): string {
  let path = raw.trim()
  if (path.startsWith("file://")) {
    path = path.slice(7)
  }
  path = path.replace(/^webpack-internal:\/\/\/[^/]*\//, "")
  path = path.replace(/^\(app-pages-browser\)\//, "")
  path = path.replace(/^\(ssr\)\//, "")
  return path
}

function isInternalPath(path: string): boolean {
  return (
    path.startsWith("node:") ||
    path.includes("webpack-internal:") ||
    path.startsWith("<") ||
    path.includes("[native code]")
  )
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function pushFrame(
  frames: StackFrame[],
  seen: Set<string>,
  unique: StackFrame[],
  frame: StackFrame,
) {
  frames.push(frame)
  const key = `${frame.path}:${frame.line}`
  if (!seen.has(key)) {
    seen.add(key)
    unique.push(frame)
  }
}

function tryV8Paren(
  line: string,
  sourceLine: number,
): StackFrame | undefined {
  const match = V8_PAREN_RE.exec(line)
  if (!match) {
    return undefined
  }
  const symbol = match[1]?.trim()
  const path = normalizePath(match[2] ?? "")
  const lineNum = Number(match[3])
  const column = match[4] ? Number(match[4]) : undefined
  if (!path || Number.isNaN(lineNum)) {
    return undefined
  }
  return {
    path,
    line: lineNum,
    column,
    symbol: symbol && symbol !== path ? symbol : undefined,
    kind: "v8",
    sourceLine,
    raw: line.trimEnd(),
  }
}

function tryV8Bare(line: string, sourceLine: number): StackFrame | undefined {
  const match = V8_BARE_RE.exec(line)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const column = match[3] ? Number(match[3]) : undefined
  if (!path || Number.isNaN(lineNum) || path.includes(" ")) {
    return undefined
  }
  return {
    path,
    line: lineNum,
    column,
    symbol: undefined,
    kind: "v8",
    sourceLine,
    raw: line.trimEnd(),
  }
}

function tryPython(line: string, sourceLine: number): StackFrame | undefined {
  const match = PYTHON_RE.exec(line)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const symbol = match[3]?.trim()
  if (!path || Number.isNaN(lineNum)) {
    return undefined
  }
  return {
    path,
    line: lineNum,
    symbol,
    kind: "python",
    sourceLine,
    raw: line.trimEnd(),
  }
}

function tryRust(line: string, sourceLine: number): StackFrame | undefined {
  const match = RUST_RE.exec(line)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const column = Number(match[3])
  if (!path || Number.isNaN(lineNum)) {
    return undefined
  }
  return {
    path,
    line: lineNum,
    column: Number.isNaN(column) ? undefined : column,
    kind: "rust",
    sourceLine,
    raw: line.trimEnd(),
  }
}

function tryPlain(line: string, sourceLine: number): StackFrame | undefined {
  if (/^\s*at\s+/.test(line)) {
    return undefined
  }
  const match = PLAIN_RE.exec(line)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const column = match[3] ? Number(match[3]) : undefined
  if (!path || Number.isNaN(lineNum) || !path.includes(".")) {
    return undefined
  }
  return {
    path,
    line: lineNum,
    column,
    kind: "plain",
    sourceLine,
    raw: line.trimEnd(),
  }
}

function parseLine(line: string, sourceLine: number): StackFrame | undefined {
  return (
    tryV8Paren(line, sourceLine) ??
    tryPython(line, sourceLine) ??
    tryRust(line, sourceLine) ??
    tryV8Bare(line, sourceLine) ??
    tryPlain(line, sourceLine)
  )
}

export type StackParseOptions = {
  hideNodeModules?: boolean
  hideInternals?: boolean
}

/**
 * Extract file:line frames from pasted stack traces (V8, Python, Rust arrow, plain).
 */
export function parseStackTrace(
  text: string,
  options: StackParseOptions = {},
): StackParseResult {
  const hideNodeModules = options.hideNodeModules ?? false
  const hideInternals = options.hideInternals ?? false
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const frames: StackFrame[] = []
  const unique: StackFrame[] = []
  const seen = new Set<string>()
  let skipped = 0
  const warnings: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const frame = parseLine(line, i + 1)
    if (!frame) {
      continue
    }

    if (hideInternals && isInternalPath(frame.path)) {
      skipped++
      continue
    }
    if (hideNodeModules && isNodeModulesPath(frame.path)) {
      skipped++
      continue
    }

    pushFrame(frames, seen, unique, frame)
  }

  if (text.trim() && frames.length === 0) {
    warnings.push(
      "No file:line frames found. Paste a Node, Next.js, Python, or Rust stack trace.",
    )
  }

  return { frames, unique, skipped, warnings }
}

export function formatStackFramesMarkdown(
  frames: StackFrame[],
  title = "Stack frames",
): string {
  if (frames.length === 0) {
    return `## ${title}\n\n_No frames._`
  }
  const lines = [`## ${title}`, ""]
  for (const frame of frames) {
    const col = frame.column ? `:${frame.column}` : ""
    const sym = frame.symbol ? ` (${frame.symbol})` : ""
    lines.push(`- \`${frame.path}:${frame.line}${col}\`${sym}`)
  }
  return lines.join("\n")
}

export function formatStackFramesPaths(frames: StackFrame[]): string {
  return frames.map((f) => `${f.path}:${f.line}`).join("\n")
}

export function frameLocation(frame: StackFrame): string {
  const col = frame.column ? `:${frame.column}` : ""
  return `${frame.path}:${frame.line}${col}`
}
