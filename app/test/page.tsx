import type { Metadata } from "next"

import { TestApp } from "@/components/test/test-app"

export const metadata: Metadata = {
  title: "Test output lab",
  description:
    "Parse Node, Vitest, and Jest test failures into grouped file:line paths for Cursor.",
}

export default function TestPage() {
  return <TestApp />
}
