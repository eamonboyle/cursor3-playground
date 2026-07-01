import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_ROUTE_PATHS } from "./defaults.ts"
import {
  formatRoutesMarkdown,
  formatRoutesPaths,
  formatRoutesTree,
  parseRoutePaths,
  segmentsToRoutePath,
} from "./parse.ts"

describe("segmentsToRoutePath", () => {
  it("strips route groups and parallel slots", () => {
    assert.equal(
      segmentsToRoutePath(["(marketing)", "about"]),
      "/about",
    )
    assert.equal(
      segmentsToRoutePath(["dashboard", "@modal", "settings"]),
      "/dashboard/settings",
    )
    assert.equal(
      segmentsToRoutePath(["_components", "preview"]),
      "/preview",
    )
  })
})

describe("parseRoutePaths", () => {
  it("parses sample app tree with pages, apis, and special files", () => {
    const result = parseRoutePaths(SAMPLE_ROUTE_PATHS)
    assert.equal(result.summary.pages, 9)
    assert.equal(result.summary.apis, 3)
    assert.equal(result.summary.layouts, 1)
    assert.equal(result.summary.special, 2)

    const root = result.routes.find(
      (route) => route.path === "/" && route.kind === "page",
    )
    assert.ok(root)
    assert.equal(root.file, "app/page.tsx")

    const finance = result.routes.find((route) => route.path === "/finance")
    assert.ok(finance)
    assert.equal(finance.kind, "page")

    const timeApi = result.routes.find((route) => route.path === "/api/time")
    assert.ok(timeApi)
    assert.equal(timeApi.kind, "api")

    const grouped = result.routes.find((route) => route.path === "/about")
    assert.ok(grouped)

    const dynamic = result.routes.find((route) => route.path === "/blog/[slug]")
    assert.ok(dynamic)

    const catchAll = result.routes.find(
      (route) => route.path === "/docs/[...segments]",
    )
    assert.ok(catchAll)
  })

  it("ignores non-app files", () => {
    const result = parseRoutePaths("components/ui/button.tsx\n")
    assert.equal(result.routes.length, 0)
    assert.ok(result.warnings.some((w) => /no app router/i.test(w)))
  })

  it("warns on empty input", () => {
    const result = parseRoutePaths("  \n")
    assert.equal(result.routes.length, 0)
    assert.ok(result.warnings.some((w) => /paste paths/i.test(w)))
  })

  it("formats markdown, paths, and tree", () => {
    const result = parseRoutePaths(SAMPLE_ROUTE_PATHS)
    const md = formatRoutesMarkdown(result)
    assert.match(md, /9\*\* page/)
    assert.match(md, /\/finance/)

    const paths = formatRoutesPaths(result)
    assert.match(paths, /^\/finance$/m)
    assert.match(paths, /^\/api\/time$/m)
    assert.ok(!paths.includes("layout"))

    const tree = formatRoutesTree(result)
    assert.match(tree, /^\/$/m)
    assert.match(tree, /finance/)
  })
})
