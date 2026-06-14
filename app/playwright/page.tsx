import type { Metadata } from "next"

import { PlaywrightApp } from "@/components/playwright/playwright-app"

export const metadata: Metadata = {
  title: "Playwright output lab",
  description:
    "Parse Playwright test failures into grouped file:line paths by browser project for Cursor.",
}

export default function PlaywrightPage() {
  return <PlaywrightApp />
}
