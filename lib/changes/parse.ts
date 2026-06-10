import type {
  ChangeStatus,
  ChangedFile,
  ChangesParseOptions,
  ChangesParseResult,
  ChangesSummary,
} from "./types"

const CHANGE_STATUSES: readonly ChangeStatus[] = [
  "added",
  "modified",
  "deleted",
  "renamed",
  "copied",
  "typechanged",
  "unmerged",
] as const

const STATUS_FROM_CODE: Record<string, ChangeStatus> = {
  A: "added",
  C: "copied",
  D: "deleted",
  M: "modified",
  R: "renamed",
  T: "typechanged",
  U: "unmerged",
}

/** git diff --name-status: STATUS[SIMILARITY][\tPATH[\tNEW_PATH]] */
const NAME_STATUS_RE = /^(A|C|D|M|R|T|U)(\d*)[\t ](.+)$/

const LOG_HEADER_RE =
  /^(commit [0-9a-f]{7,40}|Author:|Date:|Merge:|diff --git |index [0-9a-f]+|\+\+\+ |--- |\s*$)/i

function emptyByStatus(): Record<ChangeStatus, number> {
  return {
    added: 0,
    modified: 0,
    deleted: 0,
    renamed: 0,
    copied: 0,
    typechanged: 0,
    unmerged: 0,
  }
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function extensionOf(path: string): string {
  const base = path.split("/").pop() ?? path
  const dot = base.lastIndexOf(".")
  if (dot <= 0) {
    return "(no ext)"
  }
  return base.slice(dot).toLowerCase()
}

function statusFromCode(code: string): ChangeStatus | undefined {
  const first = code.charAt(0).toUpperCase()
  return STATUS_FROM_CODE[first]
}

function parseNameStatusFields(
  rest: string,
  status: ChangeStatus,
): Pick<ChangedFile, "path" | "oldPath" | "similarity"> | undefined {
  const parts = rest.split("\t").map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) {
    return undefined
  }

  if (status === "renamed" || status === "copied") {
    if (parts.length >= 2) {
      const similarityRaw = parts[0]
      const maybeSimilarity = Number(similarityRaw)
      if (!Number.isNaN(maybeSimilarity) && parts.length >= 3) {
        return {
          oldPath: parts[1],
          path: parts[2] ?? parts[1] ?? "",
          similarity: maybeSimilarity,
        }
      }
      return {
        oldPath: parts[0],
        path: parts[1] ?? parts[0] ?? "",
      }
    }
    return { path: parts[0] ?? "" }
  }

  return { path: parts[0] ?? "" }
}

function parseNameStatusLine(
  line: string,
  sourceLine: number,
): ChangedFile | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || LOG_HEADER_RE.test(trimmed)) {
    return undefined
  }

  const match = NAME_STATUS_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const code = match[1] ?? ""
  const similarityRaw = match[2] ?? ""
  const rest = match[3] ?? ""
  const status = statusFromCode(code)
  if (!status) {
    return undefined
  }

  const fields = parseNameStatusFields(rest, status)
  if (!fields?.path) {
    return undefined
  }

  const similarity =
    fields.similarity ??
    (similarityRaw ? Number(similarityRaw) : undefined)

  return {
    status,
    path: fields.path,
    oldPath: fields.oldPath,
    similarity,
    sourceLine,
    raw: trimmed,
  }
}

function looksLikePath(line: string): boolean {
  if (!line || /\s/.test(line)) {
    return false
  }
  if (/^[A-Z]$/.test(line)) {
    return false
  }
  return /[./\w-]/.test(line)
}

function parseNameOnlyLine(
  line: string,
  sourceLine: number,
): ChangedFile | undefined {
  const trimmed = line.trim()
  if (!trimmed || LOG_HEADER_RE.test(trimmed)) {
    return undefined
  }
  if (!looksLikePath(trimmed)) {
    return undefined
  }
  return {
    status: "modified",
    path: trimmed,
    sourceLine,
    raw: trimmed,
  }
}

function buildSummary(files: ChangedFile[]): ChangesSummary {
  const byStatus = emptyByStatus()
  const byExtension: Record<string, number> = {}

  for (const file of files) {
    byStatus[file.status]++
    const ext = extensionOf(file.path)
    byExtension[ext] = (byExtension[ext] ?? 0) + 1
  }

  return {
    total: files.length,
    byStatus,
    byExtension,
  }
}

function matchesExtension(path: string, extensionFilter?: string): boolean {
  if (!extensionFilter?.trim()) {
    return true
  }
  const normalized = extensionFilter.trim().toLowerCase()
  const withDot = normalized.startsWith(".") ? normalized : `.${normalized}`
  return path.toLowerCase().endsWith(withDot)
}

export function fileDisplayPath(file: ChangedFile): string {
  if (file.oldPath && file.oldPath !== file.path) {
    return `${file.oldPath} → ${file.path}`
  }
  return file.path
}

export function filterChangedFiles(
  files: ChangedFile[],
  options: ChangesParseOptions = {},
): ChangedFile[] {
  return files.filter((file) => {
    if (options.hideNodeModules && isNodeModulesPath(file.path)) {
      return false
    }
    if (
      options.statusFilter &&
      options.statusFilter !== "all" &&
      file.status !== options.statusFilter
    ) {
      return false
    }
    if (!matchesExtension(file.path, options.extensionFilter)) {
      return false
    }
    return true
  })
}

/**
 * Parse pasted `git diff --name-status`, `git log --name-status`, or
 * `git diff --name-only` output into grouped changed-file entries.
 */
export function parseChangesOutput(
  text: string,
  options: ChangesParseOptions = {},
): ChangesParseResult {
  const warnings: string[] = []
  const allFiles: ChangedFile[] = []
  const lines = text.split(/\r?\n/)

  let nameStatusHits = 0
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseNameStatusLine(lines[i] ?? "", i + 1)
    if (parsed) {
      allFiles.push(parsed)
      nameStatusHits++
    }
  }

  if (nameStatusHits === 0) {
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseNameOnlyLine(lines[i] ?? "", i + 1)
      if (parsed) {
        allFiles.push(parsed)
      }
    }
  }

  const files = filterChangedFiles(allFiles, options)
  const summary = buildSummary(files)

  if (!text.trim()) {
    warnings.push(
      "Paste git diff --name-status or git diff --name-only output to preview PR file scope.",
    )
  } else if (files.length === 0) {
    warnings.push(
      "No changed files found. Try: git diff --name-status main...HEAD",
    )
  } else if (
    options.hideNodeModules &&
    allFiles.length > files.length
  ) {
    warnings.push(
      `Hid ${allFiles.length - files.length} node_modules path(s). Toggle the filter to include them.`,
    )
  }

  return { files, summary, warnings }
}

export function formatChangesMarkdown(result: ChangesParseResult): string {
  if (result.files.length === 0) {
    return "_No changed files._"
  }

  const statusParts = CHANGE_STATUSES.filter(
    (status) => result.summary.byStatus[status] > 0,
  ).map((status) => `${status}: ${result.summary.byStatus[status]}`)

  const lines = [
    `**${result.summary.total}** file(s) — ${statusParts.join(", ")}`,
    "",
  ]

  for (const file of result.files) {
    const label = file.status.toUpperCase()
    lines.push(`- **${label}** \`${fileDisplayPath(file)}\``)
  }

  return lines.join("\n")
}

export function formatChangesPaths(result: ChangesParseResult): string {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const file of result.files) {
    if (!seen.has(file.path)) {
      seen.add(file.path)
      paths.push(file.path)
    }
  }
  return paths.join("\n")
}

export function formatChangesPrScope(result: ChangesParseResult): string {
  if (result.files.length === 0) {
    return ""
  }

  const groups = new Map<ChangeStatus, ChangedFile[]>()
  for (const file of result.files) {
    const list = groups.get(file.status) ?? []
    list.push(file)
    groups.set(file.status, list)
  }

  const lines: string[] = ["## Changed files", ""]

  for (const status of CHANGE_STATUSES) {
    const group = groups.get(status)
    if (!group?.length) {
      continue
    }
    lines.push(`### ${status}`)
    for (const file of group) {
      lines.push(`- \`${fileDisplayPath(file)}\``)
    }
    lines.push("")
  }

  return lines.join("\n").trimEnd()
}

export { CHANGE_STATUSES }
