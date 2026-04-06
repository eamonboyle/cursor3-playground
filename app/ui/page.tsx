import type { Metadata } from "next"

import { UiGalleryApp } from "@/components/ui-gallery/ui-gallery-app"

export const metadata: Metadata = {
  title: "UI gallery",
  description: "shadcn component samples with copy snippets.",
}

export default function UiGalleryPage() {
  return <UiGalleryApp />
}
