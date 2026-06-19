import type { Metadata } from "next"

import { CoverageApp } from "@/components/coverage/coverage-app"

export const metadata: Metadata = {
  title: "Coverage lab",
  description:
    "Parse Vitest, Jest, or c8 text coverage tables — rank files by lines %, filter gaps, copy paths.",
}

export default function CoveragePage() {
  return <CoverageApp />
}
