import type { Metadata } from "next"

import { LsRemoteApp } from "@/components/ls-remote/ls-remote-app"

export const metadata: Metadata = {
  title: "Git ls-remote lab",
  description:
    "Parse git ls-remote output — list remote branches and tags, resolve HEAD, copy fetch and checkout commands.",
}

export default function LsRemotePage() {
  return <LsRemoteApp />
}
