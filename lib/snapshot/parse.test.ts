import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_SNAPSHOT_JEST,
  SAMPLE_SNAPSHOT_VITEST,
} from "./defaults.ts"
import {
  formatSnapshotMarkdown,
  formatSnapshotPaths,
  formatSnapshotUpdateCommand,
  parseSnapshotOutput,
  snapshotLocation,
} from "./parse.ts"

describe("parseSnapshotOutput", () => {
  it("parses Jest snapshot failures from sample", () => {
    const result = parseSnapshotOutput(SAMPLE_SNAPSHOT_JEST)
    assert.ok(result.failures.length >= 2)
    assert.equal(result.summary.failed, 2)
    assert.equal(result.summary.obsolete, 1)
    assert.ok(
      result.failures.some(
        (f) =>
          f.path === "components/ui/button.test.tsx" &&
          f.snapshotName === "Button renders primary variant 1",
      ),
    )
    assert.ok(
      result.failures.some(
        (f) =>
          f.path === "lib/finance/compute.test.ts" &&
          f.removedLines === 2 &&
          f.addedLines === 4,
      ),
    )
    assert.ok(
      result.failures.some(
        (f) =>
          f.snapshotPath ===
          "components/crm/__snapshots__/crm-app.test.tsx.snap",
      ),
    )
  })

  it("parses Vitest snapshot failure from sample", () => {
    const result = parseSnapshotOutput(SAMPLE_SNAPSHOT_VITEST)
    assert.ok(result.failures.length >= 1)
    assert.equal(result.summary.failed, 1)
    assert.ok(
      result.failures.some(
        (f) =>
          f.path === "src/hooks/use-counter.test.ts" &&
          f.snapshotName === "useCounter increments from zero 1",
      ),
    )
  })

  it("formats paths, update command, and markdown", () => {
    const result = parseSnapshotOutput(SAMPLE_SNAPSHOT_JEST)
    const paths = formatSnapshotPaths(result)
    assert.ok(paths.includes("components/ui/button.test.tsx"))
    assert.ok(paths.includes("__snapshots__"))
    assert.equal(formatSnapshotUpdateCommand(), "pnpm test -- -u")
    const md = formatSnapshotMarkdown(result)
    assert.ok(md.includes("Snapshot summary"))
    assert.ok(md.includes("pnpm test -- -u"))
  })

  it("snapshotLocation prefers path and test name", () => {
    const result = parseSnapshotOutput(SAMPLE_SNAPSHOT_JEST)
    const failure = result.failures.find((f) => f.testName)
    assert.ok(failure)
    const loc = snapshotLocation(failure!)
    assert.ok(loc.includes("›"))
  })

  it("filters node_modules when requested", () => {
    const input = ` FAIL  node_modules/pkg/foo.test.ts
  ● suite › test
    Snapshot name: \`suite test 1\`
    - Snapshot  - 1
    + Received  + 2
`
    const filtered = parseSnapshotOutput(input, { hideNodeModules: true })
    assert.equal(filtered.failures.length, 0)
    const unfiltered = parseSnapshotOutput(input, { hideNodeModules: false })
    assert.ok(unfiltered.failures.length > 0)
  })

  it("warns on empty input", () => {
    const result = parseSnapshotOutput("")
    assert.equal(result.failures.length, 0)
    assert.ok(result.warnings.some((w) => w.includes("Paste Jest")))
  })
})
