import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_RENAME_PATHS, SAMPLE_RENAME_RULES } from "./defaults.ts"
import {
  applyRenameMap,
  applyRenameRule,
  applyRenameRules,
  formatRenameMapMarkdown,
  formatRenameMapOutput,
  normalizeRepoPath,
  parseRenameRules,
} from "./parse.ts"

describe("normalizeRepoPath", () => {
  it("normalizes slashes and strips ./ prefix", () => {
    assert.equal(normalizeRepoPath(".\\lib\\foo"), "lib/foo")
  })
})

describe("parseRenameRules", () => {
  it("parses arrow and git-style rules", () => {
    const rules = parseRenameRules(`
# comment
lib/old => lib/new
components/foo -> components/bar
R100 app/a/page.tsx app/b/page.tsx
`)
    assert.equal(rules.length, 3)
    assert.equal(rules[0]?.from, "lib/old")
    assert.equal(rules[0]?.to, "lib/new")
    assert.equal(rules[2]?.from, "app/a/page.tsx")
  })
})

describe("applyRenameRule", () => {
  it("replaces exact file paths", () => {
    assert.equal(
      applyRenameRule("app/todo/page.tsx", {
        from: "app/todo/page.tsx",
        to: "app/rename/page.tsx",
      }),
      "app/rename/page.tsx",
    )
  })

  it("replaces directory prefixes", () => {
    assert.equal(
      applyRenameRule("lib/todo/parse.ts", {
        from: "lib/todo",
        to: "lib/rename",
      }),
      "lib/rename/parse.ts",
    )
  })

  it("leaves unrelated paths unchanged", () => {
    assert.equal(
      applyRenameRule("lib/other/file.ts", {
        from: "lib/todo",
        to: "lib/rename",
      }),
      "lib/other/file.ts",
    )
  })
})

describe("applyRenameMap", () => {
  it("rewrites sample paths and ripgrep lines", () => {
    const result = applyRenameMap(SAMPLE_RENAME_RULES, SAMPLE_RENAME_PATHS)
    assert.equal(result.rules.length, 2)
    assert.equal(result.summary.total, 4)
    assert.equal(result.summary.changed, 3)

    const parseLine = result.paths.find((p) =>
      p.raw.includes("lib/todo/parse.ts:102"),
    )
    assert.ok(parseLine?.changed)
    assert.match(parseLine.after, /^lib\/rename\/parse\.ts:102:/)

    const appPage = result.paths.find((p) => p.before === "app/todo/page.tsx")
    assert.equal(appPage?.after, "app/todo/page.tsx")
    assert.equal(appPage?.changed, false)
  })

  it("applies rules longest-first then chains overlapping prefixes", () => {
    const rules = parseRenameRules(`
lib => lib-root
lib/todo => lib/rename
`)
    assert.equal(
      applyRenameRules("lib/todo/parse.ts", rules),
      "lib-root/rename/parse.ts",
    )
  })

  it("chains sequential renames across passes", () => {
    const rules = parseRenameRules(`
lib/todo => lib/rename
lib/rename => lib/final
`)
    assert.equal(
      applyRenameRules("lib/todo/parse.ts", rules),
      "lib/final/parse.ts",
    )
  })

  it("formats markdown and copyable output", () => {
    const result = applyRenameMap(SAMPLE_RENAME_RULES, "lib/todo/parse.ts\n")
    const md = formatRenameMapMarkdown(result)
    assert.match(md, /updated/)
    assert.match(md, /lib\/rename\/parse\.ts/)

    const out = formatRenameMapOutput(result)
    assert.equal(out, "lib/rename/parse.ts")
  })
})
