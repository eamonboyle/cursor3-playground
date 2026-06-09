import type { Metadata } from "next"

import { GitStatusApp } from "@/components/git-status/git-status-app"

export const metadata: Metadata = {
  title: "Git status lab",
  description:
    "Parse git status or porcelain output — group staged, unstaged, and untracked files with copyable paths.",
}

export default function GitStatusPage() {
  return <GitStatusApp />
}
