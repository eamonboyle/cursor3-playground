import type { Metadata } from "next"

import { TagsApp } from "@/components/tags/tags-app"

export const metadata: Metadata = {
  title: "Git tags lab",
  description:
    "Parse git tag output — list annotated and lightweight tags, filter semver releases, copy checkout, push, and delete commands.",
}

export default function TagsPage() {
  return <TagsApp />
}
