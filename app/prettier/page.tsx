import type { Metadata } from "next"

import { PrettierApp } from "@/components/prettier/prettier-app"

export const metadata: Metadata = {
  title: "Prettier output lab",
  description:
    "Parse prettier --check or --list-different output — list unformatted files, filter extensions, copy fix commands.",
}

export default function PrettierPage() {
  return <PrettierApp />
}
