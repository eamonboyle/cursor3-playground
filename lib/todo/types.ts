export type TodoTag = "TODO" | "FIXME" | "HACK" | "XXX" | "BUG"

export type TodoMarker = {
  path?: string
  line?: number
  column?: number
  tag: TodoTag
  message: string
  sourceLine: number
  raw: string
}

export type TodoParseSummary = {
  total: number
  byTag: Record<TodoTag, number>
}

export type TodoParseResult = {
  markers: TodoMarker[]
  summary: TodoParseSummary
  warnings: string[]
}
