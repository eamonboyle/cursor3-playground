import type { Metadata } from "next"

import { GrepApp } from "@/components/grep/grep-app"

export const metadata: Metadata = {
  title: "Ripgrep hits lab",
  description:
    "Parse ripgrep -n or -C output — group by file, filter extensions, copy file:line paths.",
}

export default function GrepPage() {
  return <GrepApp />
}
