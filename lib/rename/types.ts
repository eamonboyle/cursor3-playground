export type RenameRule = {
  from: string
  to: string
  sourceLine: number
  raw: string
}

export type RenamedPath = {
  before: string
  after: string
  changed: boolean
  sourceLine: number
  raw: string
}

export type RenameMapResult = {
  rules: RenameRule[]
  paths: RenamedPath[]
  summary: {
    total: number
    changed: number
    unchanged: number
  }
  warnings: string[]
}
