export const REMOTE_PROTOCOLS = ["https", "ssh", "git", "other"] as const

export type RemoteProtocol = (typeof REMOTE_PROTOCOLS)[number]

export const REMOTE_DIRECTIONS = ["fetch", "push"] as const

export type RemoteDirection = (typeof REMOTE_DIRECTIONS)[number]

export const REMOTE_FORMATS = ["verbose", "plain", "url-only", "mixed", "unknown"] as const

export type RemoteFormat = (typeof REMOTE_FORMATS)[number]

export type RemoteUrlLine = {
  direction: RemoteDirection
  url: string
  protocol: RemoteProtocol
  host?: string
  repoPath?: string
  sourceLine: number
}

export type RemoteEntry = {
  name: string
  fetchUrl?: string
  pushUrl?: string
  fetchProtocol?: RemoteProtocol
  pushProtocol?: RemoteProtocol
  host?: string
  repoPath?: string
  fetchPushMismatch: boolean
  urlLines: RemoteUrlLine[]
  sourceLine: number
  raw: string[]
}

export type RemoteParseSummary = {
  total: number
  https: number
  ssh: number
  mismatch: number
  plainNames: number
}

export type RemoteParseResult = {
  entries: RemoteEntry[]
  summary: RemoteParseSummary
  format: RemoteFormat
  warnings: string[]
}

export type RemoteFilter =
  | "all"
  | RemoteProtocol
  | "mismatch"
  | "plain"

export type RemoteParseOptions = {
  filter?: RemoteFilter
}
