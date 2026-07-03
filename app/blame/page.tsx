import type { Metadata } from "next"

import { BlameApp } from "@/components/blame/blame-app"

export const metadata: Metadata = {
  title: "Git blame lab",
  description:
    "Parse git blame output to group lines by author, list commit ranges, and copy Cursor citation fences.",
}

export default function BlamePage() {
  return <BlameApp />
}
