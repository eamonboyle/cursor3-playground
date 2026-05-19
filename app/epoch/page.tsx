import type { Metadata } from "next"

import { EpochApp } from "@/components/epoch/epoch-app"

export const metadata: Metadata = {
  title: "Epoch lab",
  description: "Unix and ISO time parsing with a server clock API.",
}

export default function EpochPage() {
  return <EpochApp />
}
