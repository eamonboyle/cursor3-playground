import type { Metadata } from "next"

import { GitLogApp } from "@/components/git-log/git-log-app"

export const metadata: Metadata = {
  title: "Git log lab",
  description:
    "Parse git log --oneline or full log output — group conventional commits, detect breaking changes, copy PR release notes.",
}

export default function GitLogPage() {
  return <GitLogApp />
}
