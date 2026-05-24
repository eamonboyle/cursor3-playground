import type { Metadata } from "next"

import { CommitApp } from "@/components/commit/commit-app"

export const metadata: Metadata = {
  title: "Commit message lab",
  description:
    "Lint Conventional Commits — type, scope, subject length, body wrap, and breaking-change footers.",
}

export default function CommitPage() {
  return <CommitApp />
}
