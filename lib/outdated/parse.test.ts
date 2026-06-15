import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_OUTDATED_JSON, SAMPLE_OUTDATED_TABLE } from "./defaults.ts"
import {
  formatOutdatedMarkdown,
  formatOutdatedUpdateCommand,
  parseOutdatedScan,
} from "./parse.ts"

describe("parseOutdatedScan", () => {
  it("parses sample pnpm outdated table with bump grouping", () => {
    const result = parseOutdatedScan(SAMPLE_OUTDATED_TABLE)
    assert.equal(result.summary.total, 5)
    assert.equal(result.summary.byBump.minor, 2)
    assert.equal(result.summary.byBump.major, 3)
    assert.equal(result.summary.safeCount, 2)
    assert.equal(result.summary.majorCount, 3)

    const radix = result.packages.find((p) => p.name === "radix-ui")
    assert.ok(radix)
    assert.equal(radix.bump, "minor")
    assert.equal(radix.current, "1.4.3")
    assert.equal(radix.latest, "1.5.0")

    const eslint = result.packages.find((p) => p.name === "eslint")
    assert.ok(eslint)
    assert.equal(eslint.bump, "major")
    assert.equal(eslint.depType, "devDependencies")
  })

  it("parses pnpm outdated JSON format", () => {
    const result = parseOutdatedScan(SAMPLE_OUTDATED_JSON)
    assert.equal(result.summary.total, 2)
    assert.equal(result.packages[0]?.name, "radix-ui")
    assert.equal(result.packages[1]?.depType, "devDependencies")
  })

  it("parses table with wanted column", () => {
    const text = `│ Package │ Current │ Wanted  │ Latest  │
│ lodash  │ 4.17.20 │ 4.17.21 │ 4.17.21 │`
    const result = parseOutdatedScan(text)
    assert.equal(result.packages.length, 1)
    assert.equal(result.packages[0]?.wanted, "4.17.21")
    assert.equal(result.packages[0]?.bump, "patch")
  })

  it("warns on empty input", () => {
    const result = parseOutdatedScan("  \n")
    assert.equal(result.packages.length, 0)
    assert.ok(result.warnings.some((w) => /pnpm outdated/i.test(w)))
  })

  it("formats markdown and safe update command", () => {
    const result = parseOutdatedScan(SAMPLE_OUTDATED_TABLE)
    const md = formatOutdatedMarkdown(result)
    assert.match(md, /5\*\* outdated/)
    assert.match(md, /radix-ui/)

    const cmd = formatOutdatedUpdateCommand(result, { safeOnly: true })
    assert.match(cmd, /^pnpm update /)
    assert.match(cmd, /radix-ui/)
    assert.match(cmd, /shadcn/)
    assert.doesNotMatch(cmd, /eslint/)
    assert.doesNotMatch(cmd, /typescript/)
  })
})
