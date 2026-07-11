import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_LS_REMOTE,
  SAMPLE_GIT_LS_REMOTE_HEADS,
} from "./defaults.ts"
import {
  checkoutTagCommand,
  checkoutTrackingCommand,
  filterLsRemoteEntries,
  formatLsRemoteBranchNames,
  formatLsRemoteCheckoutCommands,
  formatLsRemoteFetchCommands,
  formatLsRemoteMarkdown,
  formatLsRemoteTagNames,
  lsRemoteCommand,
  lsRemoteHeadsCommand,
  parseLsRemoteOutput,
} from "./parse.ts"

describe("parseLsRemoteOutput", () => {
  it("parses git ls-remote sample with branches, tags, and pull refs", () => {
    const result = parseLsRemoteOutput(SAMPLE_GIT_LS_REMOTE)
    assert.equal(result.summary.total, 9)
    assert.equal(result.summary.branches, 3)
    assert.equal(result.summary.tags, 2)
    assert.equal(result.summary.peeled, 2)
    assert.equal(result.summary.semverTags, 2)
    assert.equal(result.summary.defaultBranch, "main")
    assert.equal(result.summary.headHash, "a1b2c3d4e5f6789012345678abcdef0123456789")

    const main = result.entries.find((entry) => entry.name === "main")
    assert.ok(main)
    assert.equal(main.kind, "branch")
    assert.equal(main.shortHash, "e4f5a6b")

    const annotated = result.entries.find(
      (entry) => entry.name === "v1.0.0" && entry.kind === "tag",
    )
    assert.ok(annotated)
    assert.equal(annotated.isAnnotatedTag, true)
    assert.equal(annotated.peeledHash, "f0a1b2c3d4e5f6789012345678abcdef0123456789a")

    const pull = result.entries.find((entry) => entry.kind === "other")
    assert.ok(pull)
    assert.match(pull.ref, /refs\/pull\/42\/head/)
  })

  it("parses git ls-remote --heads sample", () => {
    const result = parseLsRemoteOutput(SAMPLE_GIT_LS_REMOTE_HEADS)
    assert.equal(result.summary.branches, 3)
    assert.equal(result.summary.tags, 0)
    assert.equal(result.summary.headHash, undefined)
  })

  it("filters entries by kind", () => {
    const result = parseLsRemoteOutput(SAMPLE_GIT_LS_REMOTE)
    const branches = filterLsRemoteEntries(result.entries, "branches")
    assert.equal(branches.length, 3)
    assert.ok(branches.every((entry) => entry.kind === "branch"))

    const tags = filterLsRemoteEntries(result.entries, "tags")
    assert.equal(tags.length, 4)
  })

  it("formats branch names, tags, and commands", () => {
    const result = parseLsRemoteOutput(SAMPLE_GIT_LS_REMOTE)
    const branches = formatLsRemoteBranchNames(result)
    assert.match(branches, /main/)
    assert.match(branches, /cursor\/ls-remote-lab/)

    const tags = formatLsRemoteTagNames(result)
    assert.match(tags, /v1\.0\.0/)
    assert.doesNotMatch(tags, /\^\{\}/)

    const fetch = formatLsRemoteFetchCommands(result)
    assert.match(fetch, /git fetch origin main/)

    const checkout = formatLsRemoteCheckoutCommands(result)
    assert.match(checkout, /git checkout --track origin\/main/)
  })

  it("formats markdown report", () => {
    const result = parseLsRemoteOutput(SAMPLE_GIT_LS_REMOTE)
    const md = formatLsRemoteMarkdown(result)
    assert.match(md, /9\*\* remote ref/)
    assert.match(md, /default branch/i)
    assert.match(md, /annotated/)
  })

  it("builds helper commands", () => {
    assert.equal(lsRemoteCommand(), "git ls-remote origin")
    assert.equal(lsRemoteHeadsCommand("upstream"), "git ls-remote --heads upstream")
    assert.equal(
      checkoutTrackingCommand("feature/auth"),
      "git checkout --track origin/feature/auth",
    )
    assert.equal(checkoutTagCommand("v1.0.0"), "git checkout tags/v1.0.0")
  })

  it("warns on empty input", () => {
    const result = parseLsRemoteOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((warning) => warning.includes("git ls-remote")))
  })
})
