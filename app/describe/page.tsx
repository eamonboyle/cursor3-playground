import type { Metadata } from "next"

import { DescribeApp } from "@/components/describe/describe-app"

export const metadata: Metadata = {
  title: "Git describe lab",
  description:
    "Parse git describe --tags --long output — split exact tags from tag-N-gHASH lines, copy checkout and describe commands.",
}

export default function DescribePage() {
  return <DescribeApp />
}
