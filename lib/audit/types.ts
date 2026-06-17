export type AuditSeverity = "critical" | "high" | "moderate" | "low" | "info"

export type AuditFinding = {
  severity: AuditSeverity
  title: string
  packageName: string
  vulnerableVersions: string
  patchedVersions: string
  paths: string[]
  url?: string
  cves: string[]
  sourceLine: number
}

export type AuditSummary = {
  total: number
  bySeverity: Record<AuditSeverity, number>
}

export type AuditParseResult = {
  findings: AuditFinding[]
  summary: AuditSummary
  warnings: string[]
}
