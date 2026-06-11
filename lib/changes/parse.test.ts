import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CHANGES_NAME_ONLY, SAMPLE_CHANGES_NAME_STATUS } from "./defaults.ts"
import {
  fileDisplayPath,
  formatChangesMarkdown,
  formatChangesPaths,
  formatChangesPrScope,
  parseChangesOutput,
} from "./parse.ts"

describe("parseChangesOutput", () => {
  it("parses name-status output from sample", () => {
    const result = parseChangesOutput(SAMPLE_CHANGES_NAME_STATUS, {
      hideNodeModules: true,
    })
    assert.equal(result.files.length, 10)
    assert.equal(result.summary.byStatus.added, 6)
    assert.equal(result.summary.byStatus.modified, 2)
    assert.equal(result.summary.byStatus.deleted, 1)
    assert.equal(result.summary.byStatus.renamed, 1)

    const renamed = result.files.find((f) => f.status === "renamed")
    assert.ok(renamed)
    assert.equal(renamed.oldPath, "lib/utils/format.ts")
    assert.equal(renamed.path, "lib/utils/format-path.ts")
    assert.equal(renamed.similarity, 100)
  })

  it("includes node_modules when filter is off", () => {
    const result = parseChangesOutput(SAMPLE_CHANGES_NAME_STATUS, {
      hideNodeModules: false,
    })
    assert.equal(result.files.length, 11)
    assert.ok(result.files.some((f) => f.path.includes("node_modules")))
  })

  it("parses name-only output when no status lines are present", () => {
    const result = parseChangesOutput(SAMPLE_CHANGES_NAME_ONLY)
    assert.equal(result.files.length, 3)
    assert.ok(result.files.every((f) => f.status === "modified"))
    assert.equal(result.files[0]?.path, "app/page.tsx")
  })

  it("filters by status and extension", () => {
    const result = parseChangesOutput(SAMPLE_CHANGES_NAME_STATUS, {
      hideNodeModules: true,
      statusFilter: "added",
      extensionFilter: ".ts",
    })
    assert.ok(result.files.length >= 4)
    assert.ok(result.files.every((f) => f.status === "added"))
    assert.ok(result.files.every((f) => f.path.endsWith(".ts")))
  })

  it("skips git log header lines", () => {
    const result = parseChangesOutput(`commit abc123def456
Author: Dev <dev@example.com>
Date:   Wed Jun 10 2026

M\tlib/foo.ts
A\tlib/bar.ts
`)
    assert.equal(result.files.length, 2)
  })

  it("warns on empty input", () => {
    const result = parseChangesOutput("  \n")
    assert.equal(result.files.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown, paths, and PR scope", () => {
    const result = parseChangesOutput(SAMPLE_CHANGES_NAME_STATUS, {
      hideNodeModules: true,
    })
    const md = formatChangesMarkdown(result)
    assert.match(md, /\*\*10\*\* file/)
    assert.match(md, /RENAMED/)

    const paths = formatChangesPaths(result)
    assert.ok(paths.includes("lib/changes/parse.ts"))
    assert.equal(paths.split("\n").length, 10)

    const scope = formatChangesPrScope(result)
    assert.match(scope, /## Changed files/)
    assert.match(scope, /### added/)
  })

  it("displays rename paths with arrow", () => {
    const result = parseChangesOutput("R85\told/path.ts\tnew/path.ts\n")
    const file = result.files[0]
    assert.ok(file)
    assert.equal(fileDisplayPath(file), "old/path.ts → new/path.ts")
  })
})
