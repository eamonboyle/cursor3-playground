import type { Metadata } from "next"

import { OwnersApp } from "@/components/owners/owners-app"

export const metadata: Metadata = {
  title: "CODEOWNERS lab",
  description:
    "Map changed files to CODEOWNERS reviewers with gitignore-style globs and copyable PR review requests.",
}

export default function OwnersPage() {
  return <OwnersApp />
}
