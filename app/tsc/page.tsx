import type { Metadata } from "next"

import { TscApp } from "@/components/tsc/tsc-app"

export const metadata: Metadata = {
  title: "TypeScript diagnostic lab",
  description:
    "Parse tsc and pnpm typecheck output into grouped errors with copyable file:line paths.",
}

export default function TscPage() {
  return <TscApp />
}
