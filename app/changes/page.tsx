import type { Metadata } from "next"

import { ChangesApp } from "@/components/changes/changes-app"

export const metadata: Metadata = {
  title: "Changed files lab",
  description:
    "Parse git diff name-status or name-only output to scope PR reviews with copyable paths.",
}

export default function ChangesPage() {
  return <ChangesApp />
}
