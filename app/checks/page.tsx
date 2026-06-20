import type { Metadata } from "next"

import { ChecksApp } from "@/components/checks/checks-app"

export const metadata: Metadata = {
  title: "CI checks lab",
  description:
    "Parse gh pr checks and GitHub Actions summaries — group by status, copy failing jobs and rerun hints.",
}

export default function ChecksPage() {
  return <ChecksApp />
}
