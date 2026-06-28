import type { Metadata } from "next"

import { ContextApp } from "@/components/context/context-app"

export const metadata: Metadata = {
  title: "Context size lab",
  description:
    "Estimate token usage for pasted agent context with citation and path-header splitting.",
}

export default function ContextPage() {
  return <ContextApp />
}
