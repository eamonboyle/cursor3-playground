import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_FUZZY_CANDIDATES,
  SAMPLE_FUZZY_QUERIES,
} from "./defaults.ts"
import {
  findFuzzyMatches,
  findFuzzyMatchesBatch,
  formatFuzzyMatchMarkdown,
  formatFuzzyMatchPaths,
  levenshtein,
  normalizeRepoPath,
  parsePathList,
} from "./match.ts"

describe("levenshtein", () => {
  it("returns zero for identical strings", () => {
    assert.equal(levenshtein("abc", "abc"), 0)
  })

  it("counts single-character edits", () => {
    assert.equal(levenshtein("kitten", "sitting"), 3)
    assert.equal(levenshtein("finace", "finance"), 1)
  })
})

describe("parsePathList", () => {
  it("dedupes and normalizes paths", () => {
    const paths = parsePathList(`./lib/a.ts
lib/a.ts
# comment
lib/b.ts
`)
    assert.deepEqual(paths, ["lib/a.ts", "lib/b.ts"])
  })
})

describe("findFuzzyMatches", () => {
  const candidates = parsePathList(SAMPLE_FUZZY_CANDIDATES)

  it("ranks a typo in directory name first", () => {
    const result = findFuzzyMatches("lib/finace/compute.ts", candidates)
    assert.equal(result.matches[0]?.path, "lib/finance/compute.ts")
    assert.equal(result.matches[0]?.reason, "basename")
    assert.ok(result.matches[0]!.distance <= 2)
  })

  it("matches basename when directory differs slightly", () => {
    const result = findFuzzyMatches("lib/grep/parse.ts", candidates)
    assert.equal(result.matches[0]?.path, "lib/grep/parse.ts")
  })

  it("warns when candidate list is empty", () => {
    const result = findFuzzyMatches("lib/a.ts", [])
    assert.equal(result.matches.length, 0)
    assert.ok(result.warnings.some((w) => /candidate/i.test(w)))
  })
})

describe("findFuzzyMatchesBatch", () => {
  it("parses sample queries including ripgrep lines", () => {
    const result = findFuzzyMatchesBatch(
      SAMPLE_FUZZY_QUERIES,
      SAMPLE_FUZZY_CANDIDATES,
    )
    assert.equal(result.queries.length, 4)

    const finance = result.queries.find((q) => q.query.includes("finace"))
    assert.ok(finance)
    assert.equal(finance.matches[0]?.path, "lib/finance/compute.ts")

    const crm = result.queries.find((q) => q.query.includes("crm-ap"))
    assert.ok(crm)
    assert.equal(crm.matches[0]?.path, "components/crm/crm-app.tsx")

    const demos = result.queries.find((q) => q.query.includes("demo.ts"))
    assert.ok(demos)
    assert.equal(demos.matches[0]?.path, "lib/playground/demos.ts")

    const grep = result.queries.find((q) => q.query.includes("pars.ts"))
    assert.ok(grep)
    assert.equal(grep.matches[0]?.path, "lib/grep/parse.ts")
  })

  it("formats markdown and best-match paths", () => {
    const result = findFuzzyMatchesBatch(
      SAMPLE_FUZZY_QUERIES,
      SAMPLE_FUZZY_CANDIDATES,
    )
    const md = formatFuzzyMatchMarkdown(result)
    assert.match(md, /lib\/finance\/compute\.ts/)
    assert.match(md, /Fuzzy path matches/)

    const paths = formatFuzzyMatchPaths(result)
    const lines = paths.split("\n").filter(Boolean)
    assert.equal(lines.length, 4)
    assert.match(paths, /lib\/finance\/compute\.ts/)
  })
})

describe("normalizeRepoPath", () => {
  it("strips leading ./ and trailing slashes", () => {
    assert.equal(normalizeRepoPath("./lib/foo/"), "lib/foo")
    assert.equal(normalizeRepoPath("lib\\foo\\bar.ts"), "lib/foo/bar.ts")
  })
})
