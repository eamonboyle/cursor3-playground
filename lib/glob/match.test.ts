import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_GLOB_PATTERNS, SAMPLE_REPO_PATHS } from "./defaults.ts"
import {
  filterPathsByGlobs,
  formatGlobScopeMarkdown,
  matchGlob,
} from "./filter.ts"

describe("matchGlob", () => {
  it("matches wildcards within a segment", () => {
    assert.equal(matchGlob("lib/foo.ts", "*.ts"), true)
    assert.equal(matchGlob("lib/foo.ts", "lib/*.ts"), true)
    assert.equal(matchGlob("lib/foo.ts", "app/*.ts"), false)
  })

  it("matches double-star across directories", () => {
    assert.equal(matchGlob("lib/glob/match.test.ts", "lib/**/*.test.ts"), true)
    assert.equal(matchGlob("app/page.tsx", "lib/**/*.test.ts"), false)
  })

  it("matches basename when pattern has no slash", () => {
    assert.equal(matchGlob("deep/nested/README.md", "*.md"), true)
  })

  it("matches single-character ?", () => {
    assert.equal(matchGlob("a1.ts", "a?.ts"), true)
    assert.equal(matchGlob("abc.ts", "a?.ts"), false)
  })
})

describe("filterPathsByGlobs", () => {
  it("includes test files under lib and excludes playground", () => {
    const result = filterPathsByGlobs(SAMPLE_REPO_PATHS, SAMPLE_GLOB_PATTERNS)
    const includedPaths = result.included.map((r) => r.path)

    assert.ok(includedPaths.includes("lib/glob/match.test.ts"))
    assert.ok(includedPaths.includes("lib/commit/parse.test.ts"))
    assert.ok(!includedPaths.includes("lib/playground/demos.ts"))
    assert.ok(includedPaths.includes("README.md"))
  })

  it("skips comments and empty pattern lines", () => {
    const result = filterPathsByGlobs("foo.ts\n", "# comment\n*.ts\n")
    assert.equal(result.included.length, 1)
    assert.equal(result.included[0]?.path, "foo.ts")
  })

  it("formats markdown summary", () => {
    const result = filterPathsByGlobs("a.ts\nb.md", "*.ts")
    const md = formatGlobScopeMarkdown(result)
    assert.match(md, /Glob scope/)
    assert.match(md, /a\.ts/)
  })
})
