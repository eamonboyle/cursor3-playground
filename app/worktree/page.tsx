import type { Metadata } from "next"

import { WorktreeApp } from "@/components/worktree/worktree-app"

export const metadata: Metadata = {
  title: "Git worktree lab",
  description:
    "Parse git worktree list output — inspect linked checkouts, detect locked or prunable trees, copy remove and prune commands.",
}

export default function WorktreePage() {
  return <WorktreeApp />
}
