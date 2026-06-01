import type { Metadata } from "next"

import { WhitespaceApp } from "@/components/whitespace/whitespace-app"

export const metadata: Metadata = {
  title: "Whitespace lab",
  description:
    "Detect mixed line endings, trailing whitespace, indent style, and invisible Unicode in pasted snippets.",
}

export default function WhitespacePage() {
  return <WhitespaceApp />
}
