import type { Metadata } from "next"

import { EslintApp } from "@/components/eslint/eslint-app"

export const metadata: Metadata = {
  title: "ESLint diagnostic lab",
  description:
    "Parse eslint and pnpm lint output into grouped rules with copyable file:line paths.",
}

export default function EslintPage() {
  return <EslintApp />
}
