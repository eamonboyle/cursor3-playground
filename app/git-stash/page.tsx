import type { Metadata } from "next"

import { GitStashApp } from "@/components/git-stash/git-stash-app"

export const metadata: Metadata = {
  title: "Git stash lab",
  description:
    "Parse git stash list output — inspect saved work, filter by kind, copy show/apply/pop commands.",
}

export default function GitStashPage() {
  return <GitStashApp />
}
