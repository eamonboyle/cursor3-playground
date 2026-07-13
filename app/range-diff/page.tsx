import type { Metadata } from "next"

import { RangeDiffApp } from "@/components/range-diff/range-diff-app"

export const metadata: Metadata = {
  title: "Git range-diff lab",
  description:
    "Parse git range-diff output — compare rebased commit ranges, spot added/removed/modified commits, copy show commands.",
}

export default function RangeDiffPage() {
  return <RangeDiffApp />
}
