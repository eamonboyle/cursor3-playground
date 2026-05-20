import type { Metadata } from "next"

import { CronApp } from "@/components/cron/cron-app"

export const metadata: Metadata = {
  title: "Cron lab",
  description:
    "Parse cron expressions and preview upcoming run times in local or UTC.",
}

export default function CronPage() {
  return <CronApp />
}
