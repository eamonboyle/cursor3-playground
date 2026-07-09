import type { Metadata } from "next"

import { ShortlogApp } from "@/components/shortlog/shortlog-app"

export const metadata: Metadata = {
  title: "Git shortlog lab",
  description:
    "Parse git shortlog -sn or -sne output — rank contributors by commit count, copy release notes and @mentions.",
}

export default function ShortlogPage() {
  return <ShortlogApp />
}
