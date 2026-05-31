import type { Metadata } from "next"

import { SemverApp } from "@/components/semver/semver-app"

export const metadata: Metadata = {
  title: "Semver lab",
  description:
    "Validate semver strings, compare versions with prerelease ordering, and preview major, minor, patch, or prerelease bumps.",
}

export default function SemverPage() {
  return <SemverApp />
}
