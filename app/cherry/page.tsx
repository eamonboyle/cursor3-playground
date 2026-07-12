import type { Metadata } from "next"

import { CherryApp } from "@/components/cherry/cherry-app"

export const metadata: Metadata = {
  title: "Git cherry lab",
  description:
    "Parse git cherry -v output — list unique vs patch-equivalent commits, copy show and rebase commands.",
}

export default function CherryPage() {
  return <CherryApp />
}
