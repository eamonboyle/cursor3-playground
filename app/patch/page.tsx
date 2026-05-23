import type { Metadata } from "next"

import { PatchApp } from "@/components/patch/patch-app"

export const metadata: Metadata = {
  title: "Patch lab",
  description:
    "Parse unified diffs and summarize per-file additions, deletions, and flags.",
}

export default function PatchPage() {
  return <PatchApp />
}
