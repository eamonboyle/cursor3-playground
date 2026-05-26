import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_ENV_LOCAL, SAMPLE_ENV_REFERENCE } from "./defaults.ts"
import {
  diffEnvFiles,
  formatEnvDiffMarkdown,
  maskEnvValue,
  parseEnvText,
} from "./diff.ts"

describe("parseEnvText", () => {
  it("parses keys, quoted values, and export prefix", () => {
    const result = parseEnvText(`export FOO="bar baz"
# comment
BAR='single'
BAZ=plain # inline comment`)
    assert.equal(result.byKey.size, 3)
    assert.equal(result.byKey.get("FOO")?.value, "bar baz")
    assert.equal(result.byKey.get("BAR")?.value, "single")
    assert.equal(result.byKey.get("BAZ")?.value, "plain")
  })

  it("flags malformed lines and duplicate keys", () => {
    const result = parseEnvText(`KEY=one
not-valid
KEY=two`)
    assert.equal(result.malformed.length, 1)
    assert.deepEqual(result.duplicateKeys, ["KEY"])
    assert.equal(result.byKey.get("KEY")?.value, "two")
  })
})

describe("diffEnvFiles", () => {
  it("finds missing, extra, matching, and conflicting keys", () => {
    const result = diffEnvFiles(SAMPLE_ENV_REFERENCE, SAMPLE_ENV_LOCAL)

    assert.ok(result.onlyInReference.length === 0)
    assert.ok(result.onlyInLocal.includes("DEBUG_CURSOR_PLAYGROUND"))
    assert.ok(result.matching.includes("NEXT_PUBLIC_APP_URL"))
    assert.ok(
      result.conflicting.some(
        (c) => c.key === "DATABASE_URL" || c.key === "ENABLE_ANALYTICS",
      ),
    )
  })

  it("masks values in markdown when reveal is off", () => {
    const result = diffEnvFiles(SAMPLE_ENV_REFERENCE, SAMPLE_ENV_LOCAL)
    const md = formatEnvDiffMarkdown(result, { revealValues: false })
    assert.match(md, /Env key diff/)
    assert.ok(!md.includes("app_dev") || md.includes("••••"))
  })

  it("shows values in markdown when reveal is on", () => {
    const result = diffEnvFiles("FOO=secret-value-here", "FOO=other")
    const md = formatEnvDiffMarkdown(result, { revealValues: true })
    assert.match(md, /secret-value-here/)
  })
})

describe("maskEnvValue", () => {
  it("masks short and long values", () => {
    assert.equal(maskEnvValue(""), "(empty)")
    assert.equal(maskEnvValue("ab"), "••••")
    assert.match(maskEnvValue("abcdefghij"), /^ab••••ij$/)
  })
})
