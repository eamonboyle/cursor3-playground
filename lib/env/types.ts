export type EnvEntry = {
  key: string
  value: string
  line: number
  raw: string
}

export type EnvMalformedLine = {
  line: number
  raw: string
  message: string
}

export type EnvParseResult = {
  entries: EnvEntry[]
  /** Last occurrence wins when keys repeat. */
  byKey: Map<string, EnvEntry>
  malformed: EnvMalformedLine[]
  duplicateKeys: string[]
}

export type EnvValueConflict = {
  key: string
  referenceValue: string
  localValue: string
}

export type EnvDiffResult = {
  reference: EnvParseResult
  local: EnvParseResult
  onlyInReference: string[]
  onlyInLocal: string[]
  matching: string[]
  conflicting: EnvValueConflict[]
  warnings: string[]
}

export type EnvPersisted = {
  referenceText: string
  localText: string
  revealValues: boolean
}
