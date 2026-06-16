import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_AUDIT_JSON, SAMPLE_AUDIT_TABLE } from "./defaults.ts"
import {
  formatAuditFixCommand,
  formatAuditMarkdown,
  formatAuditPackageNames,
  formatAuditPaths,
  parseAuditScan,
} from "./parse.ts"

describe("parseAuditScan", () => {
  it("parses sample pnpm audit table with severity grouping", () => {
    const result = parseAuditScan(SAMPLE_AUDIT_TABLE)
    assert.equal(result.summary.total, 2)
    assert.equal(result.summary.bySeverity.moderate, 1)
    assert.equal(result.summary.bySeverity.high, 1)

    const jsYaml = result.findings.find((f) => f.packageName === "js-yaml")
    assert.ok(jsYaml)
    assert.equal(jsYaml.severity, "moderate")
    assert.equal(jsYaml.patchedVersions, ">=4.2.0")
    assert.deepEqual(jsYaml.paths, [".>@eslint/eslintrc>js-yaml"])
    assert.match(jsYaml.url ?? "", /GHSA-h67p-54hq-rp68/)

    const lodash = result.findings.find((f) => f.packageName === "lodash")
    assert.ok(lodash)
    assert.equal(lodash.severity, "high")
  })

  it("sorts findings by severity (critical/high first)", () => {
    const result = parseAuditScan(SAMPLE_AUDIT_TABLE)
    assert.equal(result.findings[0]?.severity, "high")
    assert.equal(result.findings[1]?.severity, "moderate")
  })

  it("parses pnpm audit JSON format", () => {
    const result = parseAuditScan(SAMPLE_AUDIT_JSON)
    assert.equal(result.summary.total, 1)
    assert.equal(result.findings[0]?.packageName, "js-yaml")
    assert.deepEqual(result.findings[0]?.cves, ["CVE-2026-53550"])
  })

  it("warns on empty input", () => {
    const result = parseAuditScan("  \n")
    assert.equal(result.findings.length, 0)
    assert.ok(result.warnings.some((w) => /pnpm audit/i.test(w)))
  })

  it("formats markdown, package names, paths, and fix command", () => {
    const result = parseAuditScan(SAMPLE_AUDIT_TABLE)
    const md = formatAuditMarkdown(result)
    assert.match(md, /2\*\* vulnerabilit/)
    assert.match(md, /js-yaml/)
    assert.match(md, /lodash/)

    const names = formatAuditPackageNames(result)
    assert.match(names, /js-yaml/)
    assert.match(names, /lodash/)

    const paths = formatAuditPaths(result)
    assert.match(paths, /@eslint\/eslintrc/)

    const cmd = formatAuditFixCommand(result)
    assert.equal(cmd, "pnpm audit --fix")
  })
})
