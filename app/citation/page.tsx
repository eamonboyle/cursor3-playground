import type { Metadata } from "next"

import { CitationApp } from "@/components/citation/citation-app"

export const metadata: Metadata = {
  title: "Citation lab",
  description:
    "Build and validate Cursor code citation fences from ripgrep output or line ranges.",
}

export default function CitationPage() {
  return <CitationApp />
}
