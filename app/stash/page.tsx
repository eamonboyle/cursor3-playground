import type { Metadata } from "next"

import { StashApp } from "@/components/stash/stash-app"

export const metadata: Metadata = {
  title: "Git stash lab",
  description:
    "Parse git stash list output — group by branch and commit, copy apply, pop, show, or drop commands.",
}

export default function StashPage() {
  return <StashApp />
}
