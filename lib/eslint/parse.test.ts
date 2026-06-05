import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_ESLINT_OUTPUT } from "./defaults.ts"
import {
  diagnosticLocation,
  formatEslintMarkdown,
  formatEslintPaths,
  parseEslintOutput,
} from "./parse.ts"

describe("parseEslintOutput", () => {
  it("parses stylish format from sample output", () => {
    const result = parseEslintOutput(SAMPLE_ESLINT_OUTPUT, {
      hideNodeModules: true,
    })
    assert.equal(result.summary.errors, 2)
    assert.equal(result.summary.warnings, 2)
    assert.equal(result.diagnostics.length, 4)
    assert.ok(result.summary.byRule["@typescript-eslint/no-unused-vars"] >= 1)
    assert.ok(result.summary.byRule["no-undef"] >= 1)
    assert.equal(result.fileCount, 3)

    const crm = result.diagnostics.find((d) =>
      d.path?.includes("crm/crm-app"),
    )
    assert.ok(crm)
    assert.equal(crm.rule, "@typescript-eslint/no-unused-vars")
    assert.equal(crm.line, 14)
    assert.equal(crm.column, 7)
    assert.equal(crm.severity, "warning")
  })

  it("includes node_modules when filter is off", () => {
    const result = parseEslintOutput(SAMPLE_ESLINT_OUTPUT, {
      hideNodeModules: false,
    })
    assert.equal(result.diagnostics.length, 5)
    assert.ok(
      result.diagnostics.some((d) => d.path?.includes("node_modules")),
    )
  })

  it("parses unix format", () => {
    const result = parseEslintOutput(
      "lib/x.ts:10:5: 'foo' is not defined. [Error/no-undef]\n",
    )
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0]?.path, "lib/x.ts")
    assert.equal(result.diagnostics[0]?.line, 10)
    assert.equal(result.diagnostics[0]?.rule, "no-undef")
    assert.equal(result.diagnostics[0]?.severity, "error")
  })

  it("parses compact format", () => {
    const result = parseEslintOutput(
      "src/a.ts: line 3, col 1, Warning - Unused variable. (@typescript-eslint/no-unused-vars)\n",
    )
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0]?.path, "src/a.ts")
    assert.equal(result.diagnostics[0]?.line, 3)
    assert.equal(result.diagnostics[0]?.severity, "warning")
  })

  it("strips ANSI color codes before parsing", () => {
    const result = parseEslintOutput(
      "\x1b[4mcomponents/foo.tsx\x1b[0m\n  \x1b[90m10\x1b[0m:\x1b[90m5\x1b[0m  \x1b[31merror\x1b[0m  Message here  \x1b[90mno-undef\x1b[0m\n",
    )
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0]?.path, "components/foo.tsx")
    assert.equal(result.diagnostics[0]?.line, 10)
  })

  it("warns on empty input", () => {
    const result = parseEslintOutput("  \n")
    assert.equal(result.diagnostics.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and unique paths", () => {
    const result = parseEslintOutput(SAMPLE_ESLINT_OUTPUT)
    const md = formatEslintMarkdown(result)
    assert.match(md, /error\(s\)/)
    assert.match(md, /no-undef/)

    const paths = formatEslintPaths(result)
    assert.match(paths, /crm-app\.tsx:14/)
    assert.match(paths, /diff\.ts:19/)
  })

  it("diagnosticLocation includes column when present", () => {
    const result = parseEslintOutput(
      "lib/x.ts\n  2:9  error  Expected semicolon  semi\n",
    )
    const loc = diagnosticLocation(result.diagnostics[0]!)
    assert.equal(loc, "lib/x.ts:2:9")
  })
})
