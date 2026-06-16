import type { Metadata } from "next"

import { AuditApp } from "@/components/audit/audit-app"

export const metadata: Metadata = {
  title: "Audit lab",
  description:
    "Parse pnpm audit output — group vulnerabilities by severity, copy paths, and fix commands.",
}

export default function AuditPage() {
  return <AuditApp />
}
