import type { Metadata } from "next"

import { SemverApp } from "@/components/semver/semver-app"

export const metadata: Metadata = {
  title: "Semver lab",
  description:
    "Compare semver strings, check npm caret/tilde ranges, and sort dependency version lists.",
}

export default function SemverPage() {
  return <SemverApp />
}
