import type { Metadata } from "next"

import { StatApp } from "@/components/stat/stat-app"

export const metadata: Metadata = {
  title: "Diff stat lab",
  description:
    "Parse git diff --stat and --numstat output — rank files by churn and copy PR scope.",
}

export default function StatPage() {
  return <StatApp />
}
