import type { Metadata } from "next"

import { EnvApp } from "@/components/env/env-app"

export const metadata: Metadata = {
  title: "Env key diff",
  description:
    "Compare .env.example and local env files by key — missing, extra, and value mismatches with masked secrets.",
}

export default function EnvPage() {
  return <EnvApp />
}
