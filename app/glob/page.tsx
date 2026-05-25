import type { Metadata } from "next"

import { GlobApp } from "@/components/glob/glob-app"

export const metadata: Metadata = {
  title: "Glob scope lab",
  description:
    "Preview which repo paths match glob include and exclude patterns for agent or test scope.",
}

export default function GlobPage() {
  return <GlobApp />
}
