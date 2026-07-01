export type RouteKind =
  | "page"
  | "api"
  | "layout"
  | "loading"
  | "error"
  | "not-found"
  | "template"
  | "other"

export type RouteEntry = {
  /** URL path such as /finance or /api/time */
  path: string
  /** Repo-relative file path */
  file: string
  kind: RouteKind
  sourceLine: number
}

export type RouteParseSummary = {
  total: number
  pages: number
  apis: number
  layouts: number
  special: number
}

export type RouteParseResult = {
  routes: RouteEntry[]
  summary: RouteParseSummary
  warnings: string[]
}
