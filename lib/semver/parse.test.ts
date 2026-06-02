import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_SEMVER_LEFT,
  SAMPLE_SEMVER_LIST,
  SAMPLE_SEMVER_RANGE,
  SAMPLE_SEMVER_RIGHT,
  SAMPLE_SEMVER_VERSION,
} from "./defaults.ts"
import {
  checkSemverRange,
  compareSemver,
  compareSemverStrings,
  formatSemverCompareMarkdown,
  parseSemver,
  sortSemverLines,
} from "./parse.ts"

describe("parseSemver", () => {
  it("parses release and prerelease versions", () => {
    const v = parseSemver("2.0.0-beta.1")
    assert.equal(v.valid, true)
    assert.equal(v.major, 2)
    assert.equal(v.minor, 0)
    assert.equal(v.patch, 0)
    assert.deepEqual(v.prerelease, ["beta", "1"])
  })

  it("rejects loose versions", () => {
    assert.equal(parseSemver("1.2").valid, false)
    assert.equal(parseSemver("v1").valid, false)
  })

  it("strips leading v in sort only", () => {
    const sorted = sortSemverLines("v1.0.0\n2.0.0\n")
    assert.deepEqual(sorted.sorted, ["1.0.0", "2.0.0"])
  })
})

describe("compareSemver", () => {
  it("orders numeric prerelease identifiers", () => {
    const a = parseSemver("1.0.0-alpha")
    const b = parseSemver("1.0.0-alpha.1")
    assert.equal(compareSemver(a, b), -1)
  })

  it("release is greater than prerelease", () => {
    const rel = parseSemver("1.0.0")
    const pre = parseSemver("1.0.0-rc.1")
    assert.equal(compareSemver(rel, pre), 1)
  })

  it("compares sample left and right", () => {
    const result = compareSemverStrings(
      SAMPLE_SEMVER_LEFT,
      SAMPLE_SEMVER_RIGHT,
    )
    assert.equal(result.order, -1)
    assert.equal(result.bump, "major")
  })
})

describe("checkSemverRange", () => {
  it("caret range matches patch/minor within major", () => {
    const check = checkSemverRange(SAMPLE_SEMVER_VERSION, SAMPLE_SEMVER_RANGE)
    assert.equal(check.satisfies, true)
    assert.equal(check.rangeKind, "caret")
  })

  it("rejects version outside caret major", () => {
    const check = checkSemverRange("2.0.0", "^1.4.0")
    assert.equal(check.satisfies, false)
  })

  it("tilde locks minor for 0.x", () => {
    assert.equal(checkSemverRange("0.2.5", "~0.2.3").satisfies, true)
    assert.equal(checkSemverRange("0.3.0", "~0.2.3").satisfies, false)
  })
})

describe("sortSemverLines", () => {
  it("sorts sample list and collects invalid lines", () => {
    const result = sortSemverLines(SAMPLE_SEMVER_LIST)
    assert.deepEqual(result.sorted, [
      "0.0.1",
      "1.2.3-beta.2",
      "1.2.3",
      "1.10.0",
      "2.0.0-rc.1",
      "2.10.0",
    ])
    assert.deepEqual(result.invalid, ["not-a-version"])
  })

  it("formats compare markdown", () => {
    const result = compareSemverStrings("1.0.0", "1.0.1")
    const md = formatSemverCompareMarkdown(result)
    assert.match(md, /1\.0\.0 < 1\.0\.1/)
    assert.match(md, /patch bump/)
  })
})
