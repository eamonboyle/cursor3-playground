import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_SHORTLOG_EMAIL,
  SAMPLE_GIT_SHORTLOG_NUMBERED,
} from "./defaults.ts"
import {
  filterShortlogEntries,
  formatShortlogAtMentions,
  formatShortlogReleaseNotes,
  parseShortlogOutput,
  shortlogEmailCommand,
  shortlogNumberedCommand,
} from "./parse.ts"

describe("parseShortlogOutput", () => {
  it("parses numbered shortlog without emails", () => {
    const result = parseShortlogOutput(SAMPLE_GIT_SHORTLOG_NUMBERED)
    assert.equal(result.format, "numbered")
    assert.equal(result.summary.authors, 5)
    assert.equal(result.summary.totalCommits, 96)
    assert.equal(result.summary.withEmail, 0)
    assert.equal(result.summary.topAuthor, "Jane Smith")
    assert.equal(result.summary.topCount, 42)

    const top = result.entries[0]
    assert.ok(top)
    assert.equal(top.name, "Jane Smith")
    assert.equal(top.count, 42)
    assert.equal(top.email, undefined)

    const bot = result.entries.find((entry) => entry.name === "dependabot[bot]")
    assert.ok(bot)
    assert.equal(bot.count, 3)
  })

  it("parses numbered shortlog with emails", () => {
    const result = parseShortlogOutput(SAMPLE_GIT_SHORTLOG_EMAIL)
    assert.equal(result.summary.withEmail, 5)

    const jane = result.entries.find((entry) => entry.name === "Jane Smith")
    assert.ok(jane)
    assert.equal(jane.email, "jane@example.com")
    assert.equal(jane.count, 42)
  })

  it("parses plain author lines as count 1", () => {
    const result = parseShortlogOutput(`Jane Smith <jane@example.com>\nJohn Doe\n`)
    assert.equal(result.format, "plain")
    assert.equal(result.summary.authors, 2)
    assert.equal(result.summary.totalCommits, 2)

    const jane = result.entries.find((entry) => entry.name === "Jane Smith")
    assert.ok(jane)
    assert.equal(jane.count, 1)
    assert.equal(jane.email, "jane@example.com")
  })

  it("filters entries by email presence", () => {
    const result = parseShortlogOutput(SAMPLE_GIT_SHORTLOG_EMAIL)
    const withEmail = filterShortlogEntries(result.entries, "with-email")
    assert.equal(withEmail.length, 5)
    const withoutEmail = filterShortlogEntries(result.entries, "without-email")
    assert.equal(withoutEmail.length, 0)
  })

  it("formats release notes and @mentions", () => {
    const result = parseShortlogOutput(SAMPLE_GIT_SHORTLOG_EMAIL)
    const notes = formatShortlogReleaseNotes(result)
    assert.match(notes, /## Contributors/)
    assert.match(notes, /Jane Smith \(jane@example.com\) — 42 commits/)

    const mentions = formatShortlogAtMentions(result)
    assert.match(mentions, /@jane/)
  })

  it("builds shortlog commands", () => {
    assert.equal(shortlogNumberedCommand(), "git shortlog -sn main..HEAD")
    assert.equal(shortlogEmailCommand("v1.0.0..HEAD"), "git shortlog -sne v1.0.0..HEAD")
  })
})
