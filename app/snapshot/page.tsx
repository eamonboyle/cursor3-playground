import type { Metadata } from "next"

import { SnapshotApp } from "@/components/snapshot/snapshot-app"

export const metadata: Metadata = {
  title: "Snapshot lab",
  description:
    "Parse Jest or Vitest snapshot failures — mismatches, obsolete .snap files, and copyable update commands.",
}

export default function SnapshotPage() {
  return <SnapshotApp />
}
