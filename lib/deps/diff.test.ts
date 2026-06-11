import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_PACKAGE_BASE, SAMPLE_PACKAGE_HEAD } from "./defaults.ts"
import {
  diffPackageJson,
  formatDepsDiffMarkdown,
  formatDepsInstallHints,
  stripVersionRange,
} from "./diff.ts"
import { parsePackageJson } from "./diff.ts"

describe("parsePackageJson", () => {
  it("parses dependency sections from a full package.json", () => {
    const result = parsePackageJson(SAMPLE_PACKAGE_BASE)
    assert.equal(result.byKey.size, 7)
    assert.equal(
      result.byKey.get("dependencies:next")?.version,
      "^16.2.0",
    )
    assert.equal(
      result.byKey.get("devDependencies:typescript")?.version,
      "^5.9.0",
    )
  })

  it("reports JSON parse errors", () => {
    const result = parsePackageJson("{ not json")
    assert.equal(result.byKey.size, 0)
    assert.ok(result.warnings.some((w) => w.includes("JSON parse error")))
  })

  it("warns when no dependency sections exist", () => {
    const result = parsePackageJson('{"name":"solo"}')
    assert.equal(result.byKey.size, 0)
    assert.ok(
      result.warnings.some((w) => w.includes("No dependency sections")),
    )
  })
})

describe("stripVersionRange", () => {
  it("strips caret and tilde prefixes", () => {
    assert.equal(stripVersionRange("^16.2.7"), "16.2.7")
    assert.equal(stripVersionRange("~1.4.2"), "1.4.2")
  })

  it("leaves workspace and catalog protocols intact", () => {
    assert.equal(stripVersionRange("workspace:*"), "workspace:*")
    assert.equal(stripVersionRange("catalog:"), "catalog:")
  })
})

describe("diffPackageJson", () => {
  it("finds removed, added, matching, and changed dependencies", () => {
    const result = diffPackageJson(SAMPLE_PACKAGE_BASE, SAMPLE_PACKAGE_HEAD)

    assert.ok(
      result.onlyInBase.some(
        (e) => e.name === "date-fns" && e.section === "dependencies",
      ),
    )
    assert.ok(
      result.onlyInBase.some(
        (e) => e.name === "prettier" && e.section === "devDependencies",
      ),
    )
    assert.ok(
      result.onlyInHead.some(
        (e) => e.name === "sonner" && e.section === "dependencies",
      ),
    )
    assert.ok(
      result.onlyInHead.some(
        (e) => e.name === "@types/node" && e.section === "devDependencies",
      ),
    )
    assert.equal(result.matching.length, 0)

    const nextChange = result.changed.find((c) => c.name === "next")
    assert.ok(nextChange)
    assert.equal(nextChange?.baseVersion, "^16.2.0")
    assert.equal(nextChange?.headVersion, "^16.2.7")
    assert.equal(nextChange?.bump, "patch")
  })

  it("formats markdown and install hints", () => {
    const result = diffPackageJson(SAMPLE_PACKAGE_BASE, SAMPLE_PACKAGE_HEAD)
    const md = formatDepsDiffMarkdown(result)
    assert.match(md, /Package dependency diff/)
    assert.match(md, /sonner/)

    const hints = formatDepsInstallHints(result)
    assert.match(hints, /pnpm add sonner/)
    assert.match(hints, /pnpm remove -D prettier/)
  })
})
