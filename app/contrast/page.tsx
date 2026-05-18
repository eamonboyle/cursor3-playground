import type { Metadata } from "next"

import { ContrastApp } from "@/components/contrast/contrast-app"

export const metadata: Metadata = {
  title: "Contrast checker",
  description:
    "WCAG 2.x contrast ratio for two hex colors with AA and AAA pass indicators.",
}

export default function ContrastPage() {
  return <ContrastApp />
}
