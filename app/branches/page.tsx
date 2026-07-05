import type { Metadata } from "next"

import { BranchesApp } from "@/components/branches/branches-app"

export const metadata: Metadata = {
  title: "Git branches lab",
  description:
    "Parse git branch -vv or -a output — list local and remote branches, filter gone upstreams, copy checkout and delete commands.",
}

export default function BranchesPage() {
  return <BranchesApp />
}
