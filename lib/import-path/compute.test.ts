import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  computeRelativeImport,
  dirname,
  normalizeRepoPath,
} from "./compute.ts"

describe("normalizeRepoPath", () => {
  it("strips leading ./ and normalizes slashes", () => {
    assert.equal(normalizeRepoPath(".\\lib\\utils.ts"), "lib/utils.ts")
    assert.equal(normalizeRepoPath("./components/foo.tsx"), "components/foo.tsx")
  })
})

describe("dirname", () => {
  it("returns parent directory", () => {
    assert.equal(dirname("components/branch/branch-app.tsx"), "components/branch")
    assert.equal(dirname("page.tsx"), ".")
  })
})

describe("computeRelativeImport", () => {
  it("computes sibling import", () => {
    const r = computeRelativeImport(
      "components/foo/a.tsx",
      "components/foo/b.tsx",
      { stripExtension: true },
    )
    assert.equal(r.importPath, "./b")
    assert.equal(r.aliasPath, "@/components/foo/b")
  })

  it("walks up directories", () => {
    const r = computeRelativeImport(
      "components/branch/branch-app.tsx",
      "lib/branch/slug.ts",
      { stripExtension: true },
    )
    assert.equal(r.importPath, "../../lib/branch/slug")
  })

  it("keeps extension when requested", () => {
    const r = computeRelativeImport(
      "app/page.tsx",
      "lib/utils.ts",
      { stripExtension: false },
    )
    assert.equal(r.importPath, "../lib/utils.ts")
  })

  it("warns on identical paths", () => {
    const r = computeRelativeImport("lib/a.ts", "lib/a.ts")
    assert.ok(r.warnings.some((w) => w.includes("same file")))
  })
})
