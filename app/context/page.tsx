import type { Metadata } from "next"

import { ContextApp } from "@/components/context/context-app"

export const metadata: Metadata = {
  title: "Context size lab",
  description:
    "Estimate tokens for pasted agent context, split sections, and compare 8k, 32k, and 128k budgets.",
}

export default function ContextPage() {
  return <ContextApp />
}
