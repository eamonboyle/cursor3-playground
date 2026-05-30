import type { Metadata } from "next"

import { RenameApp } from "@/components/rename/rename-app"

export const metadata: Metadata = {
  title: "Rename map lab",
  description:
    "Apply file-move rename rules to pasted paths, ripgrep output, and stack frames after refactors.",
}

export default function RenamePage() {
  return <RenameApp />
}
