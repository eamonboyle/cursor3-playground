import type { Metadata } from "next"

import { BranchApp } from "@/components/branch/branch-app"

export const metadata: Metadata = {
  title: "Branch name lab",
  description:
    "Slugify feature titles into git-safe branch names with feat, fix, chore, or cursor prefixes.",
}

export default function BranchPage() {
  return <BranchApp />
}
