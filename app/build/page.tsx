import type { Metadata } from "next"

import { BuildApp } from "@/components/build/build-app"

export const metadata: Metadata = {
  title: "Build output lab",
  description:
    "Parse Next.js build output into grouped compile errors with copyable file:line paths.",
}

export default function BuildPage() {
  return <BuildApp />
}
