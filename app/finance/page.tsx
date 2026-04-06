import type { Metadata } from "next"

import { FinanceApp } from "@/components/finance/finance-app"

export const metadata: Metadata = {
  title: "Finance sandbox",
  description: "Personal budget demo with charts and local storage.",
}

export default function FinancePage() {
  return <FinanceApp />
}
