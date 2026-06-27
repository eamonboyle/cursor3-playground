import type { Metadata } from "next"

import { ContextApp } from "@/components/context/context-app"

export const metadata: Metadata = {
  title: "Context size lab",
  description:
    "Estimate token usage for pasted agent context — split by file, rank sections, check model budgets.",
}

export default function ContextPage() {
  return <ContextApp />
}
