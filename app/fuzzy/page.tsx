import type { Metadata } from "next"

import { FuzzyApp } from "@/components/fuzzy/fuzzy-app"

export const metadata: Metadata = {
  title: "Fuzzy path lab",
  description:
    "Rank closest repo paths for misspelled or partial paths from agent output and logs.",
}

export default function FuzzyPage() {
  return <FuzzyApp />
}
