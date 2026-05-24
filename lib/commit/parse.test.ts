import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_COMMIT_MESSAGE } from "./defaults.ts"
import { formatCommitLintReport, parseCommitMessage } from "./parse.ts"

describe("parseCommitMessage", () => {
  it("accepts a valid conventional commit with body and footer", () => {
    const result = parseCommitMessage(SAMPLE_COMMIT_MESSAGE)
    assert.equal(result.valid, true)
    assert.equal(result.type, "feat")
    assert.equal(result.scope, "commit")
    assert.equal(result.breaking, true)
    assert.equal(result.subject, "add conventional commit message linter")
    assert.equal(result.bodyLineCount, 2)
  })

  it("flags unknown type and malformed header", () => {
    const result = parseCommitMessage("WIP stuff")
    assert.equal(result.valid, false)
    assert.ok(result.issues.some((i) => i.level === "error"))
  })

  it("warns on long subject and trailing period", () => {
    const longSubject = "a".repeat(55)
    const result = parseCommitMessage(`feat: ${longSubject}.`)
    assert.equal(result.valid, true)
    assert.ok(result.issues.some((i) => /characters/.test(i.message)))
    assert.ok(result.issues.some((i) => /period/.test(i.message)))
  })

  it("errors when subject exceeds hard limit", () => {
    const tooLong = "x".repeat(73)
    const result = parseCommitMessage(`fix: ${tooLong}`)
    assert.equal(result.valid, false)
    assert.ok(result.issues.some((i) => i.level === "error"))
  })

  it("formats markdown report", () => {
    const result = parseCommitMessage("chore: bump deps")
    const report = formatCommitLintReport(result)
    assert.match(report, /pass/)
    assert.match(report, /chore/)
  })
})
