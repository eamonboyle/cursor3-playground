import type { Metadata } from "next"

import { StackApp } from "@/components/stack/stack-app"

export const metadata: Metadata = {
  title: "Stack trace lab",
  description:
    "Parse error stacks into file:line frames for quick navigation and agent context.",
}

export default function StackPage() {
  return <StackApp />
}
