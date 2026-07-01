import type { Metadata } from "next"

import { RoutesApp } from "@/components/routes/routes-app"

export const metadata: Metadata = {
  title: "App Router lab",
  description:
    "Parse Next.js app/ file paths into URL routes — pages, API handlers, layouts, and copyable route trees.",
}

export default function RoutesPage() {
  return <RoutesApp />
}
