import type {
  EnvDiffResult,
  EnvEntry,
  EnvMalformedLine,
  EnvParseResult,
} from "./types"

const KEY_VALUE_RE =
  /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/

function unquoteValue(raw: string): string {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const inner = trimmed.slice(1, -1)
    if (trimmed.startsWith('"')) {
      return inner
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
    }
    return inner
  }
  const hash = trimmed.indexOf(" #")
  if (hash > 0) {
    return trimmed.slice(0, hash).trim()
  }
  return trimmed
}

/**
 * Parse dotenv-style lines into key/value entries.
 * Skips blank lines and # comments; warns on duplicates and malformed rows.
 */
export function parseEnvText(text: string): EnvParseResult {
  const entries: EnvEntry[] = []
  const byKey = new Map<string, EnvEntry>()
  const malformed: EnvMalformedLine[] = []
  const seenKeys = new Set<string>()
  const duplicateKeys: string[] = []

  const lines = text.replace(/\r\n/g, "\n").split("\n")

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ""
    const trimmed = raw.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const match = KEY_VALUE_RE.exec(raw.trimStart())
    if (!match) {
      malformed.push({
        line: i + 1,
        raw,
        message: "Expected KEY=VALUE (optional export prefix).",
      })
      continue
    }

    const key = match[1]
    const value = unquoteValue(match[2] ?? "")

    if (seenKeys.has(key)) {
      duplicateKeys.push(key)
    }
    seenKeys.add(key)

    const entry: EnvEntry = { key, value, line: i + 1, raw }
    entries.push(entry)
    byKey.set(key, entry)
  }

  return { entries, byKey, malformed, duplicateKeys }
}

/**
 * Diff two env file bodies by key — missing keys, matching values, and conflicts.
 */
export function diffEnvFiles(
  referenceText: string,
  localText: string,
): EnvDiffResult {
  const reference = parseEnvText(referenceText)
  const local = parseEnvText(localText)
  const warnings: string[] = []

  for (const key of reference.duplicateKeys) {
    warnings.push(`Reference: duplicate key \`${key}\` (last line wins).`)
  }
  for (const key of local.duplicateKeys) {
    warnings.push(`Local: duplicate key \`${key}\` (last line wins).`)
  }
  for (const row of reference.malformed) {
    warnings.push(`Reference line ${row.line}: ${row.message}`)
  }
  for (const row of local.malformed) {
    warnings.push(`Local line ${row.line}: ${row.message}`)
  }

  const refKeys = new Set(reference.byKey.keys())
  const localKeys = new Set(local.byKey.keys())

  const onlyInReference: string[] = []
  const onlyInLocal: string[] = []
  const matching: string[] = []
  const conflicting: EnvDiffResult["conflicting"] = []

  for (const key of [...refKeys].sort((a, b) => a.localeCompare(b))) {
    if (!localKeys.has(key)) {
      onlyInReference.push(key)
    }
  }

  for (const key of [...localKeys].sort((a, b) => a.localeCompare(b))) {
    if (!refKeys.has(key)) {
      onlyInLocal.push(key)
    }
  }

  for (const key of [...refKeys].sort((a, b) => a.localeCompare(b))) {
    if (!localKeys.has(key)) {
      continue
    }
    const refVal = reference.byKey.get(key)?.value ?? ""
    const localVal = local.byKey.get(key)?.value ?? ""
    if (refVal === localVal) {
      matching.push(key)
    } else {
      conflicting.push({
        key,
        referenceValue: refVal,
        localValue: localVal,
      })
    }
  }

  if (
    reference.byKey.size === 0 &&
    local.byKey.size === 0 &&
    referenceText.trim() === "" &&
    localText.trim() === ""
  ) {
    warnings.push("Paste reference (.env.example) and local env text to compare.")
  } else if (reference.byKey.size === 0) {
    warnings.push("Reference side has no parsed keys yet.")
  } else if (local.byKey.size === 0) {
    warnings.push("Local side has no parsed keys yet.")
  }

  return {
    reference,
    local,
    onlyInReference,
    onlyInLocal,
    matching,
    conflicting,
    warnings,
  }
}

export function maskEnvValue(value: string): string {
  if (!value) {
    return "(empty)"
  }
  if (value.length <= 4) {
    return "••••"
  }
  return `${value.slice(0, 2)}••••${value.slice(-2)}`
}

export function formatEnvDiffMarkdown(
  result: EnvDiffResult,
  opts?: { revealValues?: boolean },
): string {
  const reveal = opts?.revealValues ?? false
  const lines: string[] = []
  lines.push("## Env key diff")
  lines.push("")
  lines.push(
    `- **${result.onlyInReference.length}** missing locally · **${result.onlyInLocal.length}** extra locally · **${result.conflicting.length}** value mismatch(es) · **${result.matching.length}** matching`,
  )
  lines.push(
    `- Reference keys: **${result.reference.byKey.size}** · Local keys: **${result.local.byKey.size}**`,
  )
  lines.push("")

  function valueCell(value: string) {
    return reveal ? `\`${value}\`` : `\`${maskEnvValue(value)}\``
  }

  if (result.onlyInReference.length > 0) {
    lines.push("### Missing locally (in reference only)")
    for (const key of result.onlyInReference) {
      const val = result.reference.byKey.get(key)?.value ?? ""
      lines.push(`- \`${key}\` = ${valueCell(val)}`)
    }
    lines.push("")
  }

  if (result.onlyInLocal.length > 0) {
    lines.push("### Extra locally (not in reference)")
    for (const key of result.onlyInLocal) {
      const val = result.local.byKey.get(key)?.value ?? ""
      lines.push(`- \`${key}\` = ${valueCell(val)}`)
    }
    lines.push("")
  }

  if (result.conflicting.length > 0) {
    lines.push("### Value mismatches")
    for (const row of result.conflicting) {
      lines.push(
        `- \`${row.key}\`: ref ${valueCell(row.referenceValue)} · local ${valueCell(row.localValue)}`,
      )
    }
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
