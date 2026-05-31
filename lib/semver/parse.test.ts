import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_COMPARE_LEFT,
  SAMPLE_COMPARE_RIGHT,
  SAMPLE_VERSION,
} from "./defaults.ts"
import {
  bumpSemver,
  compareSemver,
  formatSemverReport,
  parseSemver,
} from "./parse.ts"

describe("parseSemver", () => {
  it("accepts a plain release version", () => {
    const result = parseSemver(SAMPLE_VERSION)
    assert.equal(result.valid, true)
    assert.equal(result.normalized, "1.4.2")
    assert.equal(result.parts?.major, 1)
    assert.equal(result.parts?.minor, 4)
    assert.equal(result.parts?.patch, 2)
  })

  it("accepts prerelease and build metadata", () => {
    const result = parseSemver("2.0.0-rc.1+build.42")
    assert.equal(result.valid, true)
    assert.deepEqual(result.parts?.prerelease, ["rc", "1"])
    assert.deepEqual(result.parts?.build, ["build", "42"])
  })

  it("rejects invalid versions", () => {
    assert.equal(parseSemver("1.2").valid, false)
    assert.equal(parseSemver("01.2.3").valid, false)
    assert.equal(parseSemver("1.2.3-").valid, false)
  })

  it("notes leading v prefix", () => {
    const result = parseSemver("v3.1.0")
    assert.equal(result.valid, true)
    assert.equal(result.normalized, "3.1.0")
    assert.ok(result.issues.some((i) => /Leading/.test(i.message)))
  })
})

describe("compareSemver", () => {
  it("orders numeric segments", () => {
    assert.equal(compareSemver("1.0.0", "2.0.0").order, -1)
    assert.equal(compareSemver("1.2.0", "1.1.9").order, 1)
  })

  it("treats release as newer than prerelease on same core", () => {
    assert.equal(compareSemver("1.0.0", "1.0.0-alpha").order, 1)
    assert.equal(compareSemver("1.0.0-alpha", "1.0.0").order, -1)
  })

  it("compares prerelease identifiers", () => {
    const result = compareSemver(SAMPLE_COMPARE_LEFT, SAMPLE_COMPARE_RIGHT)
    assert.equal(result.valid, true)
    assert.equal(result.order, -1)
  })

  it("ignores build metadata for ordering", () => {
    assert.equal(compareSemver("1.0.0+a", "1.0.0+b").order, 0)
  })
})

describe("bumpSemver", () => {
  it("bumps patch and clears prerelease", () => {
    const result = bumpSemver("1.2.3-rc.1", "patch")
    assert.equal(result.valid, true)
    assert.equal(result.to, "1.2.4")
  })

  it("bumps minor and resets patch", () => {
    assert.equal(bumpSemver("1.2.9", "minor").to, "1.3.0")
  })

  it("bumps major and resets minor and patch", () => {
    assert.equal(bumpSemver("1.2.3", "major").to, "2.0.0")
  })

  it("increments prerelease segment", () => {
    assert.equal(bumpSemver("1.0.0", "prerelease").to, "1.0.0-0")
    assert.equal(bumpSemver("1.0.0-0", "prerelease").to, "1.0.0-1")
    assert.equal(bumpSemver("1.0.0-alpha", "prerelease").to, "1.0.0-alpha.0")
  })
})

describe("formatSemverReport", () => {
  it("includes compare and bump lines", () => {
    const parsed = parseSemver("1.0.0")
    const compare = compareSemver("1.0.0", "2.0.0")
    const bump = bumpSemver("1.0.0", "minor")
    const report = formatSemverReport(parsed, compare, bump)
    assert.match(report, /valid/)
    assert.match(report, /older than/)
    assert.match(report, /Bump minor/)
  })
})
