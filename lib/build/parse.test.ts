import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_BUILD_OUTPUT } from "./defaults.ts"
import {
  errorLocation,
  formatBuildMarkdown,
  formatBuildPaths,
  parseBuildOutput,
} from "./parse.ts"

describe("parseBuildOutput", () => {
  it("parses Next.js build output from sample log", () => {
    const result = parseBuildOutput(SAMPLE_BUILD_OUTPUT, {
      hideNodeModules: true,
    })
    assert.ok(result.errors.length >= 4)
    assert.equal(result.fileCount, 4)

    const dashboard = result.errors.find((e) =>
      e.path?.includes("dashboard/page"),
    )
    assert.ok(dashboard)
    assert.equal(dashboard.kind, "type-error")
    assert.equal(dashboard.line, 25)
    assert.equal(dashboard.column, 8)
    assert.match(dashboard.message, /not assignable/)

    const button = result.errors.find((e) =>
      e.path?.includes("button.tsx"),
    )
    assert.ok(button)
    assert.equal(button.kind, "module-not-found")
    assert.equal(button.module, "@/lib/missing")

    const diff = result.errors.find((e) => e.path?.includes("env/diff"))
    assert.ok(diff)
    assert.equal(diff.line, 88)
    assert.equal(diff.kind, "type-error")
  })

  it("includes node_modules when filter is off", () => {
    const result = parseBuildOutput(SAMPLE_BUILD_OUTPUT, {
      hideNodeModules: false,
    })
    assert.ok(result.errors.some((e) => e.path?.includes("node_modules")))
  })

  it("parses standalone file header with module-not-found", () => {
    const result = parseBuildOutput(
      "./src/foo.ts\nModule not found: Can't resolve 'lodash'\n",
    )
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0]?.path, "src/foo.ts")
    assert.equal(result.errors[0]?.module, "lodash")
    assert.equal(result.errors[0]?.kind, "module-not-found")
  })

  it("parses file:line:col header followed by type error", () => {
    const result = parseBuildOutput(
      "./lib/x.ts:3:1\nType error: Property 'y' does not exist.\n",
    )
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0]?.path, "lib/x.ts")
    assert.equal(result.errors[0]?.line, 3)
    assert.equal(result.errors[0]?.column, 1)
    assert.equal(result.errors[0]?.kind, "type-error")
  })

  it("parses generic Error lines under a file header", () => {
    const result = parseBuildOutput(
      "./app/api/route.ts\nError: Route segment config is invalid.\n",
    )
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0]?.path, "app/api/route.ts")
    assert.match(result.errors[0]?.message ?? "", /Route segment/)
  })

  it("strips ANSI codes before parsing", () => {
    const result = parseBuildOutput(
      "\x1b[4m./components/foo.tsx:10:5\x1b[0m\n\x1b[31mType error:\x1b[0m boom\n",
    )
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0]?.path, "components/foo.tsx")
    assert.equal(result.errors[0]?.line, 10)
  })

  it("warns on empty input", () => {
    const result = parseBuildOutput("  \n")
    assert.equal(result.errors.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and unique paths", () => {
    const result = parseBuildOutput(SAMPLE_BUILD_OUTPUT)
    const md = formatBuildMarkdown(result)
    assert.match(md, /error\(s\)/)
    assert.match(md, /type-error/)

    const paths = formatBuildPaths(result)
    assert.match(paths, /dashboard\/page\.tsx:25/)
    assert.match(paths, /diff\.ts:88/)
  })

  it("errorLocation includes column when present", () => {
    const result = parseBuildOutput(
      "./lib/x.ts:2:9\nType error: Expected semicolon\n",
    )
    const loc = errorLocation(result.errors[0]!)
    assert.equal(loc, "lib/x.ts:2:9")
  })
})
