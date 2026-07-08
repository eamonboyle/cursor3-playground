import type {
  RemoteDirection,
  RemoteEntry,
  RemoteFilter,
  RemoteFormat,
  RemoteParseOptions,
  RemoteParseResult,
  RemoteParseSummary,
  RemoteProtocol,
  RemoteUrlLine,
} from "./types"

const VERBOSE_LINE_RE = /^(\S+)\s+(\S+)\s+\((fetch|push)\)$/i

const PLAIN_NAME_RE = /^[A-Za-z0-9._-]+$/

const URL_ONLY_RE = /^(?:https?:\/\/|git@|git:\/\/|ssh:\/\/)/i

function parseRemoteUrl(url: string): Pick<
  RemoteUrlLine,
  "protocol" | "host" | "repoPath"
> {
  const sshMatch = /^git@([^:]+):(.+?)(?:\.git)?$/i.exec(url)
  if (sshMatch) {
    const host = sshMatch[1]
    const repoPath = sshMatch[2]?.replace(/\.git$/i, "")
    return { protocol: "ssh", host, repoPath }
  }

  const scpStyle = /^ssh:\/\/git@([^/]+)\/(.+?)(?:\.git)?$/i.exec(url)
  if (scpStyle) {
    const host = scpStyle[1]
    const repoPath = scpStyle[2]?.replace(/\.git$/i, "")
    return { protocol: "ssh", host, repoPath }
  }

  if (url.startsWith("git://")) {
    const gitMatch = /^git:\/\/([^/]+)\/(.+?)(?:\.git)?$/i.exec(url)
    const host = gitMatch?.[1]
    const repoPath = gitMatch?.[2]?.replace(/\.git$/i, "")
    return { protocol: "git", host, repoPath }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url)
      const repoPath = parsed.pathname
        .replace(/^\//, "")
        .replace(/\.git$/i, "")
      return {
        protocol: "https",
        host: parsed.host,
        repoPath: repoPath || undefined,
      }
    } catch {
      return { protocol: "https" }
    }
  }

  return { protocol: "other" }
}

function buildSummary(entries: RemoteEntry[]): RemoteParseSummary {
  let https = 0
  let ssh = 0
  let mismatch = 0
  let plainNames = 0

  for (const entry of entries) {
    if (entry.urlLines.length === 0) {
      plainNames++
      continue
    }
    if (entry.fetchPushMismatch) {
      mismatch++
    }
    const protocols = new Set(
      entry.urlLines.map((line) => line.protocol).filter((p) => p !== "other"),
    )
    if (protocols.has("https")) {
      https++
    }
    if (protocols.has("ssh")) {
      ssh++
    }
  }

  return {
    total: entries.length,
    https,
    ssh,
    mismatch,
    plainNames,
  }
}

function detectFormat(
  verboseCount: number,
  plainCount: number,
  urlOnlyCount: number,
): RemoteFormat {
  const kinds = [verboseCount, plainCount, urlOnlyCount].filter((count) => count > 0)
  if (kinds.length === 0) {
    return "unknown"
  }
  if (kinds.length > 1) {
    return "mixed"
  }
  if (verboseCount > 0) {
    return "verbose"
  }
  if (plainCount > 0) {
    return "plain"
  }
  return "url-only"
}

function groupUrlLines(
  lines: Array<RemoteUrlLine & { name: string; raw: string }>,
): RemoteEntry[] {
  const byName = new Map<string, RemoteEntry>()

  for (const line of lines) {
    const existing = byName.get(line.name)
    const urlInfo = parseRemoteUrl(line.url)
    const urlLine: RemoteUrlLine = {
      direction: line.direction,
      url: line.url,
      protocol: urlInfo.protocol,
      host: urlInfo.host,
      repoPath: urlInfo.repoPath,
      sourceLine: line.sourceLine,
    }

    if (!existing) {
      const entry: RemoteEntry = {
        name: line.name,
        urlLines: [urlLine],
        fetchPushMismatch: false,
        sourceLine: line.sourceLine,
        raw: [line.raw],
      }
      if (line.direction === "fetch") {
        entry.fetchUrl = line.url
        entry.fetchProtocol = urlInfo.protocol
      } else {
        entry.pushUrl = line.url
        entry.pushProtocol = urlInfo.protocol
      }
      entry.host = urlInfo.host
      entry.repoPath = urlInfo.repoPath
      byName.set(line.name, entry)
      continue
    }

    existing.urlLines.push(urlLine)
    existing.raw.push(line.raw)
    if (line.direction === "fetch") {
      existing.fetchUrl = line.url
      existing.fetchProtocol = urlInfo.protocol
    } else {
      existing.pushUrl = line.url
      existing.pushProtocol = urlInfo.protocol
    }
    if (!existing.host && urlInfo.host) {
      existing.host = urlInfo.host
    }
    if (!existing.repoPath && urlInfo.repoPath) {
      existing.repoPath = urlInfo.repoPath
    }
  }

  for (const entry of byName.values()) {
    if (entry.fetchUrl && entry.pushUrl) {
      entry.fetchPushMismatch = entry.fetchUrl !== entry.pushUrl
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Parse pasted `git remote`, `git remote -v`, or `git remote get-url` output.
 */
export function parseRemoteOutput(text: string): RemoteParseResult {
  const warnings: string[] = []
  const verboseLines: Array<RemoteUrlLine & { name: string; raw: string }> = []
  const plainNames: RemoteEntry[] = []
  let verboseCount = 0
  let plainCount = 0
  let urlOnlyCount = 0

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const verboseMatch = VERBOSE_LINE_RE.exec(trimmed)
    if (verboseMatch) {
      verboseCount++
      const name = verboseMatch[1] ?? ""
      const url = verboseMatch[2] ?? ""
      const direction = (verboseMatch[3]?.toLowerCase() ?? "fetch") as RemoteDirection
      verboseLines.push({
        name,
        url,
        direction,
        protocol: "other",
        sourceLine: i + 1,
        raw: trimmed,
      })
      continue
    }

    if (URL_ONLY_RE.test(trimmed)) {
      urlOnlyCount++
      const urlInfo = parseRemoteUrl(trimmed)
      plainNames.push({
        name: "(url)",
        fetchUrl: trimmed,
        fetchProtocol: urlInfo.protocol,
        host: urlInfo.host,
        repoPath: urlInfo.repoPath,
        fetchPushMismatch: false,
        urlLines: [
          {
            direction: "fetch",
            url: trimmed,
            protocol: urlInfo.protocol,
            host: urlInfo.host,
            repoPath: urlInfo.repoPath,
            sourceLine: i + 1,
          },
        ],
        sourceLine: i + 1,
        raw: [trimmed],
      })
      continue
    }

    if (PLAIN_NAME_RE.test(trimmed)) {
      plainCount++
      plainNames.push({
        name: trimmed,
        fetchPushMismatch: false,
        urlLines: [],
        sourceLine: i + 1,
        raw: [trimmed],
      })
    }
  }

  const grouped = groupUrlLines(verboseLines)
  const entries = [...grouped, ...plainNames].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  if (!text.trim()) {
    warnings.push(
      "Paste `git remote -v` output — one row per remote name, URL, and fetch or push direction.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No remote rows found. Run `git remote -v` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    format: detectFormat(verboseCount, plainCount, urlOnlyCount),
    warnings,
  }
}

export function filterRemoteEntries(
  entries: RemoteEntry[],
  filter: RemoteFilter = "all",
): RemoteEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "plain":
      return entries.filter((entry) => entry.urlLines.length === 0)
    case "mismatch":
      return entries.filter((entry) => entry.fetchPushMismatch)
    case "https":
    case "ssh":
    case "git":
    case "other":
      return entries.filter((entry) =>
        entry.urlLines.some((line) => line.protocol === filter),
      )
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function remoteListVerboseCommand(): string {
  return "git remote -v"
}

export function remoteGetUrlCommand(name: string, push = false): string {
  return push ? `git remote get-url --push ${name}` : `git remote get-url ${name}`
}

export function remoteSetUrlCommand(
  name: string,
  url: string,
  push = false,
): string {
  return push
    ? `git remote set-url --push ${name} ${url}`
    : `git remote set-url ${name} ${url}`
}

export function remoteAddCommand(name: string, url: string): string {
  return `git remote add ${name} ${url}`
}

export function remoteRemoveCommand(name: string): string {
  return `git remote remove ${name}`
}

export function remoteRenameCommand(oldName: string, newName: string): string {
  return `git remote rename ${oldName} ${newName}`
}

export function remotePruneFetchCommand(name: string): string {
  return `git fetch ${name} --prune`
}

export function formatRemoteNames(
  result: RemoteParseResult,
  options: RemoteParseOptions = {},
): string {
  const entries = filterRemoteEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.name).join("\n")
}

export function formatRemoteFetchUrls(
  result: RemoteParseResult,
  options: RemoteParseOptions = {},
): string {
  const entries = filterRemoteEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => entry.fetchUrl)
    .filter((url): url is string => Boolean(url))
    .join("\n")
}

export function formatRemoteSetUrlCommands(
  result: RemoteParseResult,
  options: RemoteParseOptions = {},
): string {
  const entries = filterRemoteEntries(result.entries, options.filter ?? "all")
  return entries
    .flatMap((entry) => {
      const commands: string[] = []
      if (entry.fetchUrl && entry.name !== "(url)") {
        commands.push(remoteSetUrlCommand(entry.name, entry.fetchUrl))
      }
      if (entry.pushUrl && entry.pushUrl !== entry.fetchUrl && entry.name !== "(url)") {
        commands.push(remoteSetUrlCommand(entry.name, entry.pushUrl, true))
      }
      return commands
    })
    .join("\n")
}

export function formatRemoteRemoveCommands(
  result: RemoteParseResult,
  options: RemoteParseOptions = {},
): string {
  const entries = filterRemoteEntries(result.entries, options.filter ?? "all")
  return entries
    .filter((entry) => entry.name !== "(url)")
    .map((entry) => remoteRemoveCommand(entry.name))
    .join("\n")
}

export function formatRemoteMarkdown(result: RemoteParseResult): string {
  if (result.entries.length === 0) {
    return "_No remotes found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** remote(s) — ${summary.https} HTTPS, ${summary.ssh} SSH, ${summary.mismatch} fetch/push mismatch`,
    "",
    "| Remote | Fetch | Push | Protocol | Host |",
    "|--------|-------|------|----------|------|",
  ]

  for (const entry of result.entries) {
    const fetch = entry.fetchUrl ?? "—"
    const push = entry.pushUrl ?? "—"
    const protocol = entry.fetchProtocol ?? entry.pushProtocol ?? "—"
    const host = entry.host ?? "—"
    const mismatch = entry.fetchPushMismatch ? " ⚠️" : ""
    lines.push(
      `| \`${entry.name}\`${mismatch} | ${fetch} | ${push} | ${protocol} | ${host} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
