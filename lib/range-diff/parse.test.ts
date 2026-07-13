import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_RANGE_DIFF,
  SAMPLE_GIT_RANGE_DIFF_SHORT,
} from "./defaults.ts"
import {
  filterRangeDiffEntries,
  formatRangeDiffMarkdown,
  formatRangeDiffNewHashes,
  formatRangeDiffShowCommands,
  formatRangeDiffSubjects,
  parseRangeDiffOutput,
  rangeDiffCommand,
  rangeDiffReflogCommand,
  showCommitCommand,
} from "./parse.ts"

describe("parseRangeDiffOutput", () => {
  it("parses full git range-diff sample with all comparison kinds", () => {
    const result = parseRangeDiffOutput(SAMPLE_GIT_RANGE_DIFF)
    assert.equal(result.summary.total, 4)
    assert.equal(result.summary.added, 1)
    assert.equal(result.summary.equal, 1)
    assert.equal(result.summary.modified, 1)
    assert.equal(result.summary.removed, 1)
    assert.equal(result.summary.withPatch, 1)

    const added = result.entries.find((entry) => entry.comparison === "added")
    assert.equal(added?.right.shortHash, "0ddba11")
    assert.match(added?.subject ?? "", /inevitable/)

    const equal = result.entries.find((entry) => entry.comparison === "equal")
    assert.equal(equal?.left.shortHash, "c0debee")
    assert.equal(equal?.right.shortHash, "cab005e")

    const modified = result.entries.find(
      (entry) => entry.comparison === "modified",
    )
    assert.equal(modified?.left.shortHash, "f00dba1")
    assert.equal(modified?.right.shortHash, "decafe1")
    assert.equal(modified?.hasPatch, true)
    assert.ok((modified?.patchLines ?? 0) > 0)

    const removed = result.entries.find((entry) => entry.comparison === "removed")
    assert.equal(removed?.left.shortHash, "bedead")
    assert.equal(removed?.right.placeholder, true)
  })

  it("parses short sample without patch bodies", () => {
    const result = parseRangeDiffOutput(SAMPLE_GIT_RANGE_DIFF_SHORT)
    assert.equal(result.summary.total, 3)
    assert.equal(result.summary.equal, 2)
    assert.equal(result.summary.added, 1)
    assert.equal(result.summary.withPatch, 0)
  })

  it("filters entries by comparison", () => {
    const result = parseRangeDiffOutput(SAMPLE_GIT_RANGE_DIFF)
    const modified = filterRangeDiffEntries(result.entries, "modified")
    assert.equal(modified.length, 1)
    assert.equal(modified[0]?.comparisonSymbol, "!")

    const added = filterRangeDiffEntries(result.entries, "added")
    assert.equal(added.length, 1)
  })

  it("formats hashes, subjects, and show commands", () => {
    const result = parseRangeDiffOutput(SAMPLE_GIT_RANGE_DIFF_SHORT)
    const newHashes = formatRangeDiffNewHashes(result, { filter: "added" })
    assert.match(newHashes, /9f8e7d6/)

    const subjects = formatRangeDiffSubjects(result, { filter: "equal" })
    assert.match(subjects, /session refresh/)
    assert.match(subjects, /profile route/)

    const show = formatRangeDiffShowCommands(result, { filter: "added" })
    assert.match(show, /git show 9f8e7d6/)
  })

  it("formats markdown report", () => {
    const result = parseRangeDiffOutput(SAMPLE_GIT_RANGE_DIFF)
    const md = formatRangeDiffMarkdown(result)
    assert.match(md, /4\*\* commit pair/)
    assert.match(md, /modified/)
    assert.match(md, /Describe a bug/)
  })

  it("builds helper commands", () => {
    assert.equal(
      rangeDiffCommand(),
      "git range-diff origin/main...topic@{1} origin/main...topic",
    )
    assert.equal(rangeDiffReflogCommand(), "git range-diff @{u} @{1} @")
    assert.equal(showCommitCommand("abc1234"), "git show abc1234")
  })

  it("warns on empty input", () => {
    const result = parseRangeDiffOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((warning) => warning.includes("range-diff")))
  })
})
