/** Sample `pnpm audit` table output for the demo textarea. */
export const SAMPLE_AUDIT_TABLE = `┌─────────────────────┬────────────────────────────────────────────────────────┐
│ moderate            │ JS-YAML: Quadratic-complexity DoS in merge key         │
│                     │ handling via repeated aliases                          │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ js-yaml                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <=4.1.1                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=4.2.0                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ .>@eslint/eslintrc>js-yaml                             │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-h67p-54hq-rp68      │
└─────────────────────┴────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ high                │ Example transitive dependency advisory                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ lodash                                                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <4.17.21                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=4.17.21                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ .>some-app>lodash                                      │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-xxxxx               │
└─────────────────────┴────────────────────────────────────────────────────────┘
2 vulnerabilities found
Severity: 1 moderate | 1 high`

/** Sample \`pnpm audit --json\` output (trimmed). */
export const SAMPLE_AUDIT_JSON = `{
  "advisories": {
    "1120792": {
      "findings": [
        {
          "version": "4.1.1",
          "paths": [".>@eslint/eslintrc>js-yaml"]
        }
      ],
      "title": "JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases",
      "severity": "moderate",
      "module_name": "js-yaml",
      "vulnerable_versions": "<=4.1.1",
      "patched_versions": ">=4.2.0",
      "cves": ["CVE-2026-53550"],
      "url": "https://github.com/advisories/GHSA-h67p-54hq-rp68"
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 1,
      "high": 0,
      "critical": 0
    }
  }
}`
