import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GH_PR_CHECKS,
  SAMPLE_STATUS_LINES,
} from "./defaults.ts"
import {
  formatChecksMarkdown,
  formatFailingCheckNames,
  formatRerunHints,
  parseChecksOutput,
} from "./parse.ts"

describe("parseChecksOutput", () => {
  it("parses gh pr checks table from sample output", () => {
    const result = parseChecksOutput(SAMPLE_GH_PR_CHECKS, {
      hideSkipped: true,
    })

    assert.equal(result.summary.fail, 2)
    assert.equal(result.summary.pass, 3)
    assert.equal(result.summary.pending, 1)
    assert.equal(result.summary.skipped, 0)
    assert.equal(result.checks.length, 6)
    assert.match(result.headline ?? "", /not successful/i)

    const lint = result.checks.find((check) => check.name.includes("lint"))
    assert.ok(lint)
    assert.equal(lint.status, "fail")
    assert.equal(lint.elapsed, "1m12s")
    assert.ok(lint.url?.includes("github.com"))
  })

  it("includes skipped checks when filter is off", () => {
    const result = parseChecksOutput(SAMPLE_GH_PR_CHECKS, {
      hideSkipped: false,
    })
    assert.equal(result.checks.length, 7)
    assert.ok(
      result.checks.some((check) => check.name.includes("deploy-preview")),
    )
  })

  it("parses GitHub Actions summary lines", () => {
    const result = parseChecksOutput(SAMPLE_STATUS_LINES)
    assert.equal(result.summary.fail, 2)
    assert.equal(result.summary.pass, 2)
    assert.equal(result.checks.length, 4)
    assert.ok(result.checks.some((check) => check.name.includes("lint")))
  })

  it("parses name: status lines", () => {
    const result = parseChecksOutput(
      "lint (pull_request): fail\ntypecheck: pass\ne2e: pending\n",
    )
    assert.equal(result.summary.fail, 1)
    assert.equal(result.summary.pass, 1)
    assert.equal(result.summary.pending, 1)
  })

  it("parses gh pr checks JSON", () => {
    const result = parseChecksOutput(
      JSON.stringify([
        { name: "lint", state: "FAILURE", link: "https://example.com/1" },
        { name: "test", state: "SUCCESS", link: "https://example.com/2" },
      ]),
    )
    assert.equal(result.checks.length, 2)
    assert.equal(result.checks[0]?.status, "fail")
    assert.equal(result.checks[1]?.status, "pass")
  })

  it("strips ANSI color codes before parsing", () => {
    const result = parseChecksOutput(
      "\x1b[31mX\x1b[0m  \x1b[4mlint (pull_request)\x1b[0m               Process completed with errors.    42s\n",
    )
    assert.equal(result.checks.length, 1)
    assert.equal(result.checks[0]?.name, "lint (pull_request)")
    assert.equal(result.checks[0]?.status, "fail")
  })

  it("warns on empty input", () => {
    const result = parseChecksOutput("  \n")
    assert.equal(result.checks.length, 0)
    assert.ok(result.warnings.some((warning) => /paste/i.test(warning)))
  })

  it("formats markdown and failing check names", () => {
    const result = parseChecksOutput(SAMPLE_GH_PR_CHECKS)
    const md = formatChecksMarkdown(result)
    assert.match(md, /not successful|failing/i)
    assert.match(md, /lint \(pull_request\)/)

    const names = formatFailingCheckNames(result)
    assert.match(names, /lint/)
    assert.match(names, /build/)
  })

  it("builds rerun hints for failed checks", () => {
    const result = parseChecksOutput(SAMPLE_GH_PR_CHECKS)
    const hints = formatRerunHints(result)
    assert.match(hints, /gh run rerun --failed/)
    assert.match(hints, /pnpm typecheck/)
    assert.match(hints, /github\.com/)
  })
})
