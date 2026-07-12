import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_CHERRY_PLAIN,
  SAMPLE_GIT_CHERRY_VERBOSE,
} from "./defaults.ts"
import {
  cherryCommand,
  cherryVerboseCommand,
  filterCherryEntries,
  formatCherryHashes,
  formatCherryMarkdown,
  formatCherryRebaseHint,
  formatCherryShowCommands,
  formatCherrySubjects,
  parseCherryOutput,
  showCommitCommand,
} from "./parse.ts"

describe("parseCherryOutput", () => {
  it("parses git cherry -v sample with unique and equivalent commits", () => {
    const result = parseCherryOutput(SAMPLE_GIT_CHERRY_VERBOSE)
    assert.equal(result.summary.total, 5)
    assert.equal(result.summary.unique, 3)
    assert.equal(result.summary.equivalent, 2)
    assert.equal(result.summary.hasSubjects, true)
    assert.equal(result.format, "verbose")

    const unique = result.entries.filter((entry) => entry.sign === "unique")
    assert.equal(unique.length, 3)
    assert.equal(unique[0]?.shortHash, "a1b2c3d")
    assert.match(unique[0]?.subject ?? "", /session refresh/)

    const equivalent = result.entries.filter((entry) => entry.sign === "equivalent")
    assert.equal(equivalent.length, 2)
    assert.equal(equivalent[0]?.sign, "equivalent")
  })

  it("parses git cherry plain sample without subjects", () => {
    const result = parseCherryOutput(SAMPLE_GIT_CHERRY_PLAIN)
    assert.equal(result.summary.total, 5)
    assert.equal(result.summary.hasSubjects, false)
    assert.equal(result.format, "plain")
  })

  it("filters entries by sign", () => {
    const result = parseCherryOutput(SAMPLE_GIT_CHERRY_VERBOSE)
    const unique = filterCherryEntries(result.entries, "unique")
    assert.equal(unique.length, 3)
    assert.ok(unique.every((entry) => entry.sign === "unique"))

    const equivalent = filterCherryEntries(result.entries, "equivalent")
    assert.equal(equivalent.length, 2)
  })

  it("formats hashes, subjects, and show commands", () => {
    const result = parseCherryOutput(SAMPLE_GIT_CHERRY_VERBOSE)
    const hashes = formatCherryHashes(result, { filter: "unique" })
    assert.match(hashes, /a1b2c3d4e5f6789012345678abcdef0123456789/)
    assert.doesNotMatch(hashes, /c9d8e7f6/)

    const subjects = formatCherrySubjects(result, { filter: "unique" })
    assert.match(subjects, /session refresh/)
    assert.match(subjects, /profile route/)

    const show = formatCherryShowCommands(result, { filter: "unique" })
    assert.match(show, /git show a1b2c3d4e5f6789012345678abcdef0123456789/)
  })

  it("formats markdown report", () => {
    const result = parseCherryOutput(SAMPLE_GIT_CHERRY_VERBOSE)
    const md = formatCherryMarkdown(result)
    assert.match(md, /5\*\* commit/)
    assert.match(md, /3\*\* unique/)
    assert.match(md, /2\*\* equivalent/)
    assert.match(md, /session refresh/)
  })

  it("builds helper commands", () => {
    assert.equal(cherryCommand(), "git cherry origin/main")
    assert.equal(cherryVerboseCommand("upstream/develop"), "git cherry -v upstream/develop")
    assert.equal(
      showCommitCommand("abc1234"),
      "git show abc1234",
    )
    assert.match(formatCherryRebaseHint(), /git rebase -i origin\/main/)
  })

  it("warns on empty input", () => {
    const result = parseCherryOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((warning) => warning.includes("git cherry")))
  })
})
