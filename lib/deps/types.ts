export type DepSection =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies"

export const DEP_SECTIONS: DepSection[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]

export type DepEntry = {
  name: string
  version: string
  section: DepSection
}

export type PackageParseResult = {
  entries: DepEntry[]
  /** Keyed by `section:name`. */
  byKey: Map<string, DepEntry>
  warnings: string[]
}

export type DepVersionChange = {
  name: string
  section: DepSection
  baseVersion: string
  headVersion: string
  /** Semver bump when both sides look like comparable versions. */
  bump: "major" | "minor" | "patch" | "prerelease" | "none" | "unknown"
}

export type DepsDiffResult = {
  base: PackageParseResult
  head: PackageParseResult
  onlyInBase: DepEntry[]
  onlyInHead: DepEntry[]
  matching: DepEntry[]
  changed: DepVersionChange[]
  warnings: string[]
}

export type DepsPersisted = {
  baseText: string
  headText: string
  sections: DepSection[]
}
