import type { PatchFileChange, PatchParseResult } from "./types"

type MutableFile = {
  path: string
  oldPath?: string
  newPath?: string
  additions: number
  deletions: number
  binary: boolean
  isNew: boolean
  isDeleted: boolean
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

function finalize(file: MutableFile): PatchFileChange {
  const path = displayPath(file)
  const isRename =
    Boolean(file.oldPath && file.newPath) && file.oldPath !== file.newPath
  return {
    path,
    oldPath: file.oldPath,
    newPath: file.newPath,
    additions: file.additions,
    deletions: file.deletions,
    binary: file.binary,
    isNew: file.isNew,
    isDeleted: file.isDeleted,
    isRename,
  }
}

function startFile(
  fromGit: { oldPath?: string; newPath?: string },
): MutableFile {
  const oldPath = fromGit.oldPath
  const newPath = fromGit.newPath
  return {
    path: newPath ?? oldPath ?? "unknown",
    oldPath,
    newPath,
    additions: 0,
    deletions: 0,
    binary: false,
    isNew: false,
    isDeleted: false,
  }
}

/**
 * Parse a unified diff (e.g. `git diff` output) into per-file line stats.
 */
export function parseUnifiedDiff(text: string): PatchParseResult {
  const warnings: string[] = []
  const files: PatchFileChange[] = []
  let current: MutableFile | null = null

  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      if (current) {
        files.push(finalize(current))
      }
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

    if (line.startsWith("@@")) {
      continue
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions++
      continue
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions++
    }
  }

  if (current) {
    files.push(finalize(current))
  }

  if (!text.trim()) {
    warnings.push("Paste a unified diff to analyze.")
  } else if (files.length === 0) {
    warnings.push(
      "No diff --git headers found; paste output from git diff or a .patch file.",
    )
  }

  let additions = 0
  let deletions = 0
  let binaryCount = 0
  for (const f of files) {
    additions += f.additions
    deletions += f.deletions
    if (f.binary) {
      binaryCount++
    }
  }

  return {
    files,
    summary: {
      fileCount: files.length,
      additions,
      deletions,
      binaryCount,
    },
    warnings,
  }
}

export function formatPatchSummaryMarkdown(result: PatchParseResult): string {
  const { summary, files } = result
  if (files.length === 0) {
    return "_No files parsed._"
  }

  const lines = [
    `**${summary.fileCount}** file(s), **+${summary.additions}** / **-${summary.deletions}**`,
  ]
  if (summary.binaryCount > 0) {
    lines[0] += `, **${summary.binaryCount}** binary`
  }
  lines.push("")
  for (const f of files) {
    const flags: string[] = []
    if (f.isNew) {
      flags.push("new")
    }
    if (f.isDeleted) {
      flags.push("deleted")
    }
    if (f.isRename) {
      flags.push("rename")
    }
    if (f.binary) {
      flags.push("binary")
    }
    const suffix = flags.length ? ` _(${flags.join(", ")})_` : ""
    if (f.binary) {
      lines.push(`- \`${f.path}\`${suffix}`)
    } else {
      lines.push(`- \`${f.path}\` (+${f.additions}/-${f.deletions})${suffix}`)
    }
  }
  return lines.join("\n")
}
