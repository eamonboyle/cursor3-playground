import type { Metadata } from "next"

import { HunksApp } from "@/components/hunks/hunks-app"

export const metadata: Metadata = {
  title: "Diff hunk lab",
  description:
    "Parse unified diffs into per-hunk line ranges with copyable start:end:filepath citations.",
}

export default function HunksPage() {
  return <HunksApp />
}
