import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_REMOTE_PLAIN,
  SAMPLE_GIT_REMOTE_VERBOSE,
} from "./defaults.ts"
import {
  filterRemoteEntries,
  formatRemoteMarkdown,
  parseRemoteOutput,
  remoteAddCommand,
  remoteGetUrlCommand,
  remoteListVerboseCommand,
  remoteRemoveCommand,
  remoteSetUrlCommand,
} from "./parse.ts"

describe("parseRemoteOutput", () => {
  it("parses git remote -v with HTTPS and SSH remotes", () => {
    const result = parseRemoteOutput(SAMPLE_GIT_REMOTE_VERBOSE)
    assert.equal(result.summary.total, 3)
    assert.equal(result.summary.https, 2)
    assert.equal(result.summary.ssh, 2)
    assert.equal(result.summary.mismatch, 1)
    assert.equal(result.format, "verbose")

    const origin = result.entries.find((entry) => entry.name === "origin")
    assert.ok(origin)
    assert.equal(
      origin.fetchUrl,
      "https://github.com/eamonboyle/cursor3-playground.git",
    )
    assert.equal(origin.pushUrl, origin.fetchUrl)
    assert.equal(origin.fetchPushMismatch, false)
    assert.equal(origin.fetchProtocol, "https")
    assert.equal(origin.host, "github.com")
    assert.equal(origin.repoPath, "eamonboyle/cursor3-playground")

    const upstream = result.entries.find((entry) => entry.name === "upstream")
    assert.ok(upstream)
    assert.equal(upstream.fetchProtocol, "ssh")
    assert.equal(upstream.host, "github.com")
    assert.equal(upstream.repoPath, "original/cursor3-playground")

    const fork = result.entries.find((entry) => entry.name === "fork")
    assert.ok(fork)
    assert.equal(fork.fetchPushMismatch, true)
    assert.equal(fork.fetchProtocol, "https")
    assert.equal(fork.pushProtocol, "ssh")
  })

  it("parses plain git remote name list", () => {
    const result = parseRemoteOutput(SAMPLE_GIT_REMOTE_PLAIN)
    assert.equal(result.summary.total, 3)
    assert.equal(result.summary.plainNames, 3)
    assert.equal(result.format, "plain")
    assert.equal(result.entries[0]?.urlLines.length, 0)
  })

  it("parses a single get-url line", () => {
    const result = parseRemoteOutput(
      "https://github.com/eamonboyle/cursor3-playground.git",
    )
    assert.equal(result.summary.total, 1)
    assert.equal(result.format, "url-only")
    assert.equal(result.entries[0]?.fetchProtocol, "https")
  })

  it("filters by protocol and mismatch", () => {
    const result = parseRemoteOutput(SAMPLE_GIT_REMOTE_VERBOSE)
    assert.equal(filterRemoteEntries(result.entries, "ssh").length, 2)
    assert.equal(filterRemoteEntries(result.entries, "mismatch").length, 1)
    assert.equal(filterRemoteEntries(result.entries, "plain").length, 0)
  })

  it("builds remote management commands", () => {
    assert.equal(remoteListVerboseCommand(), "git remote -v")
    assert.equal(remoteGetUrlCommand("origin"), "git remote get-url origin")
    assert.equal(
      remoteSetUrlCommand("origin", "https://example.com/a.git"),
      "git remote set-url origin https://example.com/a.git",
    )
    assert.equal(
      remoteAddCommand("upstream", "git@github.com:org/repo.git"),
      "git remote add upstream git@github.com:org/repo.git",
    )
    assert.equal(remoteRemoveCommand("fork"), "git remote remove fork")
  })

  it("formats markdown report", () => {
    const result = parseRemoteOutput(SAMPLE_GIT_REMOTE_VERBOSE)
    const md = formatRemoteMarkdown(result)
    assert.match(md, /\*\*3\*\* remote/)
    assert.match(md, /`origin`/)
    assert.match(md, /fetch\/push mismatch/)
  })
})
