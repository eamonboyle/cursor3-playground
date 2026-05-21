import type { Metadata } from "next"

import { JsonApp } from "@/components/json/json-app"

export const metadata: Metadata = {
  title: "JSON lab",
  description:
    "Validate, format, and minify JSON with structure stats and parse error hints.",
}

export default function JsonPage() {
  return <JsonApp />
}
