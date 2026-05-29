import type { ImportPathOptions, ImportPathResult } from "./types"

const EXT_RE = /\.(tsx?|jsx?|mjs|cjs)$/i

/** Normalize a repo-relative path to forward slashes without leading `./`. */
export function normalizeRepoPath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "")
}

export function dirname(filePath: string): string {
  const normalized = normalizeRepoPath(filePath)
  const last = normalized.lastIndexOf("/")
  if (last === -1) {
    return "."
  }
  const dir = normalized.slice(0, last)
  return dir || "."
}

function splitParts(path: string): string[] {
  if (!path || path === ".") {
    return []
  }
  return normalizeRepoPath(path).split("/").filter(Boolean)
}

function maybeStripExtension(target: string, strip: boolean): string {
  if (!strip) {
    return target
  }
  return target.replace(EXT_RE, "")
}

/**
 * Compute a relative ES module import from `fromFile` to `toFile`.
 * Both paths are repo-relative (e.g. `components/foo.tsx` → `lib/utils.ts`).
 */
export function computeRelativeImport(
  fromFile: string,
  toFile: string,
  options: Partial<ImportPathOptions> = {},
): ImportPathResult {
  const opts: ImportPathOptions = {
    stripExtension: options.stripExtension ?? true,
    useAlias: options.useAlias ?? true,
    aliasPrefix: options.aliasPrefix ?? "@",
  }

  const warnings: string[] = []
  const from = normalizeRepoPath(fromFile)
  const to = normalizeRepoPath(toFile)

  if (!from) {
    warnings.push("Enter a source file path (the file that will contain the import).")
  }
  if (!to) {
    warnings.push("Enter a target file path (the module being imported).")
  }

  if (!from || !to) {
    return {
      importPath: "",
      aliasPath: null,
      fromDir: from ? dirname(from) : ".",
      warnings,
    }
  }

  const fromDir = dirname(from)
  const fromParts = splitParts(fromDir)
  const toParts = splitParts(to)

  const common = (() => {
    let i = 0
    while (
      i < fromParts.length &&
      i < toParts.length &&
      fromParts[i] === toParts[i]
    ) {
      i++
    }
    return i
  })()

  const up = fromParts.length - common
  const down = toParts.slice(common)
  const segments = [...Array(up).fill(".."), ...down]
  let importPath =
    segments.length === 0 ? `./${toParts[toParts.length - 1] ?? to}` : segments.join("/")

  if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
    importPath = `./${importPath}`
  }

  importPath = maybeStripExtension(importPath, opts.stripExtension)

  const aliasPrefix = opts.aliasPrefix.endsWith("/")
    ? opts.aliasPrefix.slice(0, -1)
    : opts.aliasPrefix
  const aliasPath = opts.useAlias
    ? maybeStripExtension(`${aliasPrefix}/${to}`, opts.stripExtension)
    : null

  if (from === to) {
    warnings.push("Source and target are the same file — prefer a local import or split the module.")
  }

  return {
    importPath,
    aliasPath,
    fromDir,
    warnings,
  }
}

export function formatImportPathMarkdown(
  fromFile: string,
  toFile: string,
  result: ImportPathResult,
): string {
  const lines: string[] = ["## Import path", ""]
  lines.push(`- **From:** \`${normalizeRepoPath(fromFile) || "(empty)"}\``)
  lines.push(`- **To:** \`${normalizeRepoPath(toFile) || "(empty)"}\``)
  lines.push("")

  if (result.importPath) {
    lines.push("### Relative")
    lines.push("```ts")
    lines.push(`import { … } from "${result.importPath}"`)
    lines.push("```")
    lines.push("")
  }

  if (result.aliasPath) {
    lines.push("### Alias")
    lines.push("```ts")
    lines.push(`import { … } from "${result.aliasPath}"`)
    lines.push("```")
    lines.push("")
  }

  if (result.warnings.length > 0) {
    lines.push("### Warnings")
    for (const w of result.warnings) {
      lines.push(`- ${w}`)
    }
  }

  return lines.join("\n").trim()
}
