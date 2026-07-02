import type { Metadata } from "next"

import { StashApp } from "@/components/stash/stash-app"

export const metadata: Metadata = {
  title: "Git stash lab",
  description:
    "Parse git stash list and show output — copy apply, pop, and file scope for agent context.",
}

export default function StashPage() {
  return <StashApp />
}
