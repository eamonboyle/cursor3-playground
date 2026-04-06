import type { Metadata } from "next"

import { CrmApp } from "@/components/crm/crm-app"

export const metadata: Metadata = {
  title: "Tiny CRM",
  description: "Contacts with search and detail sheet.",
}

export default function CrmPage() {
  return <CrmApp />
}
