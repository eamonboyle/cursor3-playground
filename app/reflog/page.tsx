import type { Metadata } from "next"

import { ReflogApp } from "@/components/reflog/reflog-app"

export const metadata: Metadata = {
  title: "Git reflog lab",
  description:
    "Parse git reflog output — trace HEAD movements, filter by operation, copy reset and checkout recovery commands.",
}

export default function ReflogPage() {
  return <ReflogApp />
}
