import type { Metadata } from "next"

import { LocApp } from "@/components/loc/loc-app"

export const metadata: Metadata = {
  title: "Line count lab",
  description:
    "Parse wc -l output to rank files by line count, group by extension, and copy refactor scope paths.",
}

export default function LocPage() {
  return <LocApp />
}
