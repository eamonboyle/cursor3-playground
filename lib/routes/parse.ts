import type { RouteEntry, RouteKind, RouteParseResult } from "./types"

const ROUTE_FILE_RE =
  /^(?:src\/)?app\/(.+)\/(page|route|layout|loading|error|not-found|template)\.(tsx|ts|jsx|js|mdx|md)$/i

const ROOT_PAGE_RE =
  /^(?:src\/)?app\/(page)\.(tsx|ts|jsx|js|mdx|md)$/i

const ROUTE_KIND_BY_FILE: Record<string, RouteKind> = {
  page: "page",
  route: "api",
  layout: "layout",
  loading: "loading",
  error: "error",
  "not-found": "not-found",
  template: "template",
}

function emptySummary() {
  return {
    total: 0,
    pages: 0,
    apis: 0,
    layouts: 0,
    special: 0,
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").trim()
}

/**
 * Strip Next.js route groups `(name)`, parallel `@slot`, and private `_folder` segments.
 */
export function segmentsToRoutePath(segments: string[]): string {
  const visible = segments.filter((segment) => {
    if (!segment) {
      return false
    }
    if (segment.startsWith("(") && segment.endsWith(")")) {
      return false
    }
    if (segment.startsWith("@")) {
      return false
    }
    if (segment.startsWith("_")) {
      return false
    }
    return true
  })

  if (visible.length === 0) {
    return "/"
  }

  return `/${visible.join("/")}`
}

function classifyRouteFile(
  file: string,
  sourceLine: number,
): RouteEntry | undefined {
  const normalized = normalizePath(file)
  if (!normalized) {
    return undefined
  }

  const root = ROOT_PAGE_RE.exec(normalized)
  if (root) {
    return {
      path: "/",
      file: normalized,
      kind: "page",
      sourceLine,
    }
  }

  const match = ROUTE_FILE_RE.exec(normalized)
  if (!match) {
    return undefined
  }

  const segmentPath = match[1] ?? ""
  const fileKind = match[2]?.toLowerCase() ?? ""
  const kind = ROUTE_KIND_BY_FILE[fileKind] ?? "other"
  const segments = segmentPath.split("/").filter(Boolean)
  const path = segmentsToRoutePath(segments)

  return {
    path,
    file: normalized,
    kind,
    sourceLine,
  }
}

function bumpSummary(
  summary: RouteParseResult["summary"],
  kind: RouteKind,
): void {
  summary.total++
  switch (kind) {
    case "page":
      summary.pages++
      break
    case "api":
      summary.apis++
      break
    case "layout":
      summary.layouts++
      break
    case "loading":
    case "error":
    case "not-found":
    case "template":
      summary.special++
      break
    case "other":
      break
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function sortRoutes(routes: RouteEntry[]): RouteEntry[] {
  const kindOrder: Record<RouteKind, number> = {
    page: 0,
    api: 1,
    layout: 2,
    loading: 3,
    error: 4,
    "not-found": 5,
    template: 6,
    other: 7,
  }

  return [...routes].sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path)
    if (pathCmp !== 0) {
      return pathCmp
    }
    const kindCmp = kindOrder[a.kind] - kindOrder[b.kind]
    if (kindCmp !== 0) {
      return kindCmp
    }
    return a.file.localeCompare(b.file)
  })
}

/**
 * Parse pasted repo paths into Next.js App Router URL routes.
 */
export function parseRoutePaths(text: string): RouteParseResult {
  const warnings: string[] = []
  const routes: RouteEntry[] = []
  const summary = emptySummary()
  const seen = new Set<string>()

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ""
    const trimmed = raw.trim()
    if (!trimmed) {
      continue
    }

    const entry = classifyRouteFile(trimmed, i + 1)
    if (!entry) {
      continue
    }

    const key = `${entry.kind}:${entry.path}:${entry.file}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)

    routes.push(entry)
    bumpSummary(summary, entry.kind)
  }

  if (!text.trim()) {
    warnings.push(
      "Paste paths from find app -type f or a file tree under app/.",
    )
  } else if (routes.length === 0) {
    warnings.push(
      "No App Router files found. Expect paths like app/finance/page.tsx or app/api/time/route.ts.",
    )
  }

  return {
    routes: sortRoutes(routes),
    summary,
    warnings,
  }
}

export function formatRoutesMarkdown(result: RouteParseResult): string {
  if (result.routes.length === 0) {
    return "_No routes found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.pages}** page(s), **${summary.apis}** API route(s), **${summary.layouts}** layout(s)`,
    "",
  ]

  for (const route of result.routes) {
    lines.push(
      `- **${route.kind}** \`${route.path}\` — \`${route.file}\``,
    )
  }

  return lines.join("\n")
}

export function formatRoutesPaths(result: RouteParseResult): string {
  const paths = result.routes
    .filter((route) => route.kind === "page" || route.kind === "api")
    .map((route) => route.path)

  return [...new Set(paths)].join("\n")
}

export function formatRoutesTree(result: RouteParseResult): string {
  const pages = result.routes.filter((route) => route.kind === "page")
  if (pages.length === 0) {
    return ""
  }

  type TreeNode = { children: Map<string, TreeNode>; isRoute: boolean }
  const root: TreeNode = { children: new Map(), isRoute: false }

  for (const route of pages) {
    const parts =
      route.path === "/" ? [] : route.path.replace(/^\//, "").split("/")
    let node = root
    for (const part of parts) {
      let child = node.children.get(part)
      if (!child) {
        child = { children: new Map(), isRoute: false }
        node.children.set(part, child)
      }
      node = child
    }
    node.isRoute = true
  }

  const lines: string[] = []

  function walk(node: TreeNode, prefix: string, depth: number): void {
    const entries = [...node.children.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )
    for (const [segment, child] of entries) {
      const connector = depth === 0 ? "" : "  ".repeat(depth - 1) + "├─ "
      const label = child.isRoute ? `${segment}  → /${buildPath(prefix, segment)}` : segment
      lines.push(`${connector}${label}`)
      walk(child, buildPath(prefix, segment), depth + 1)
    }
  }

  function buildPath(prefix: string, segment: string): string {
    return prefix ? `${prefix}/${segment}` : segment
  }

  if (root.isRoute || pages.some((route) => route.path === "/")) {
    lines.unshift("/")
  }

  walk(root, "", 0)
  return lines.join("\n")
}
