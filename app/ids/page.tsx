import type { Metadata } from "next"

import { IdsApp } from "@/components/ids/ids-app"

export const metadata: Metadata = {
  title: "ID lab",
  description:
    "Generate UUIDs, hex secrets, and URL-safe tokens with the Web Crypto API.",
}

export default function IdsPage() {
  return <IdsApp />
}
