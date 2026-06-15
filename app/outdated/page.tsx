import type { Metadata } from "next"

import { OutdatedApp } from "@/components/outdated/outdated-app"

export const metadata: Metadata = {
  title: "Outdated packages lab",
  description:
    "Parse pnpm outdated output — group patch, minor, and major bumps with copyable update commands.",
}

export default function OutdatedPage() {
  return <OutdatedApp />
}
