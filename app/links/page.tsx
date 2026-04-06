import type { Metadata } from "next"

import { LinksApp } from "@/components/links/links-app"

export const metadata: Metadata = {
  title: "Link organizer",
  description: "Save links with Open Graph previews.",
}

export default function LinksPage() {
  return <LinksApp />
}
