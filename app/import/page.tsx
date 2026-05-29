import type { Metadata } from "next"

import { ImportPathApp } from "@/components/import-path/import-path-app"

export const metadata: Metadata = {
  title: "Import path lab",
  description:
    "Compute relative and @/ alias import strings when moving or refactoring files.",
}

export default function ImportPage() {
  return <ImportPathApp />
}
