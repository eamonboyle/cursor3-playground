import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_PRETTIER_CHECK,
  SAMPLE_PRETTIER_LIST,
} from "./defaults.ts"
import {
  formatPrettierMarkdown,
  formatPrettierPaths,
  formatPrettierWriteCommand,
  parsePrettierOutput,
} from "./parse.ts"

describe("parsePrettierOutput", () => {
  it("parses prettier --check output from sample", () => {
    const result = parsePrettierOutput(SAMPLE_PRETTIER_CHECK)
    assert.equal(result.summary.fileCount, 3)
    assert.ok(result.files.some((f) => f.path === "components/crm/crm-app.tsx"))
    assert.ok(result.files.some((f) => f.path === "lib/finance/compute.ts"))
    assert.equal(result.summary.allFormatted, false)
  })

  it("parses prettier --list-different paths", () => {
    const result = parsePrettierOutput(SAMPLE_PRETTIER_LIST, {
      hideNodeModules: true,
    })
    assert.equal(result.summary.fileCount, 3)
    assert.ok(!result.files.some((f) => f.path.includes("node_modules")))
  })

  it("includes node_modules when filter is off", () => {
    const result = parsePrettierOutput(SAMPLE_PRETTIER_LIST, {
      hideNodeModules: false,
    })
    assert.equal(result.summary.fileCount, 4)
    assert.ok(result.files.some((f) => f.path.includes("node_modules")))
  })

  it("filters by extension", () => {
    const result = parsePrettierOutput(SAMPLE_PRETTIER_CHECK, {
      extensionFilter: ".tsx",
    })
    assert.ok(result.files.every((f) => f.path.endsWith(".tsx")))
    assert.equal(result.summary.fileCount, 1)
  })

  it("detects all-formatted success message", () => {
    const result = parsePrettierOutput(
      "Checking formatting...\nAll matched files use Prettier code style!\n",
    )
    assert.equal(result.summary.fileCount, 0)
    assert.equal(result.summary.allFormatted, true)
    assert.ok(result.warnings.some((w) => w.includes("Prettier code style")))
  })

  it("formats paths and write command", () => {
    const result = parsePrettierOutput(SAMPLE_PRETTIER_CHECK)
    const paths = formatPrettierPaths(result)
    assert.ok(paths.includes("lib/finance/compute.ts"))
    const cmd = formatPrettierWriteCommand(result)
    assert.ok(cmd.startsWith("pnpm exec prettier --write"))
    assert.ok(cmd.includes('"lib/finance/compute.ts"'))
  })

  it("formats markdown report", () => {
    const result = parsePrettierOutput(SAMPLE_PRETTIER_CHECK)
    const md = formatPrettierMarkdown(result)
    assert.ok(md.includes("3** unformatted file(s)"))
    assert.ok(md.includes("`components/crm/crm-app.tsx`"))
  })

  it("warns on empty input", () => {
    const result = parsePrettierOutput("")
    assert.equal(result.files.length, 0)
    assert.ok(result.warnings.some((w) => w.includes("Paste output")))
  })
})
