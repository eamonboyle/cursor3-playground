import type { Metadata } from "next"

import { ConflictApp } from "@/components/conflict/conflict-app"

export const metadata: Metadata = {
  title: "Merge conflict lab",
  description:
    "Parse git conflict markers, compare ours vs theirs, and copy Cursor citations.",
}

export default function ConflictPage() {
  return <ConflictApp />
}
