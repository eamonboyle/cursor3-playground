import type { Metadata } from "next"

import { DepsApp } from "@/components/deps/deps-app"

export const metadata: Metadata = {
  title: "Package dependency diff",
  description:
    "Compare two package.json files for added, removed, and bumped dependencies with pnpm install hints.",
}

export default function DepsPage() {
  return <DepsApp />
}
