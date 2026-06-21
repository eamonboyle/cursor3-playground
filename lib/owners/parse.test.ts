import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CHANGED_PATHS, SAMPLE_CODEOWNERS } from "./defaults.ts"
import {
  formatCodeownersMarkdown,
  formatReviewRequest,
  formatUnownedPaths,
  parseCodeownersRules,
  resolveCodeowners,
} from "./parse.ts"

describe("parseCodeownersRules", () => {
  it("parses patterns, owners, and section comments", () => {
    const { rules, warnings } = parseCodeownersRules(SAMPLE_CODEOWNERS)
    assert.equal(rules.length, 13)
    assert.equal(warnings.length, 0)
    assert.equal(rules[0]?.pattern, "*")
    assert.deepEqual(rules[0]?.owners, ["@eamonboyle"])
    assert.equal(rules[rules.length - 1]?.pattern, "/app/api/")
    assert.deepEqual(rules[rules.length - 1]?.owners, ["@platform-team"])
  })

  it("warns on lines without owners", () => {
    const { rules, warnings } = parseCodeownersRules("*.ts\n")
    assert.equal(rules.length, 0)
    assert.ok(warnings.some((warning) => /line 1/i.test(warning)))
  })
})

describe("resolveCodeowners", () => {
  it("assigns last matching rule per path", () => {
    const result = resolveCodeowners(SAMPLE_CODEOWNERS, SAMPLE_CHANGED_PATHS)

    const ownersRule = result.matches.find((match) =>
      match.path.includes("lib/owners/parse.ts"),
    )
    assert.ok(ownersRule)
    assert.deepEqual(ownersRule.owners, ["@eamonboyle"])
    assert.equal(ownersRule.matchedPattern, "*")

    const finance = result.matches.find((match) =>
      match.path.includes("lib/finance/compute.ts"),
    )
    assert.ok(finance)
    assert.deepEqual(finance.owners, ["@finance-squad"])

    const testFile = result.matches.find((match) =>
      match.path.endsWith("parse.test.ts"),
    )
    assert.ok(testFile)
    assert.deepEqual(testFile.owners, ["@qa-team"])
    assert.equal(testFile.matchedPattern, "**/*.test.ts")

    const apiRoute = result.matches.find((match) =>
      match.path.includes("app/api/rsvp/route.ts"),
    )
    assert.ok(apiRoute)
    assert.deepEqual(apiRoute.owners, ["@platform-team"])
  })

  it("groups owners and lists unowned paths", () => {
    const result = resolveCodeowners(
      "* @default\n",
      "owned.ts\norphan.ts\n",
    )
    assert.equal(result.summary.owned, 2)
    assert.equal(result.summary.unowned, 0)
    assert.equal(result.byOwner.length, 1)
    assert.equal(result.byOwner[0]?.owner, "@default")
  })

  it("formats markdown and review request text", () => {
    const result = resolveCodeowners(SAMPLE_CODEOWNERS, SAMPLE_CHANGED_PATHS)
    const markdown = formatCodeownersMarkdown(result)
    assert.match(markdown, /CODEOWNERS review map/)
    assert.match(markdown, /@finance-squad/)

    const request = formatReviewRequest(result)
    assert.match(request, /@qa-team/)
    assert.match(request, /@platform-team/)

    const unowned = formatUnownedPaths(result)
    assert.equal(unowned, "")
  })

  it("warns on empty inputs", () => {
    const result = resolveCodeowners("  \n", "  \n")
    assert.ok(result.warnings.some((warning) => /CODEOWNERS/i.test(warning)))
    assert.ok(result.warnings.some((warning) => /changed paths/i.test(warning)))
  })
})
