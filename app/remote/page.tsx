import type { Metadata } from "next"

import { RemoteApp } from "@/components/remote/remote-app"

export const metadata: Metadata = {
  title: "Git remote lab",
  description:
    "Parse git remote -v output — group fetch and push URLs, detect HTTPS vs SSH, copy set-url and prune commands.",
}

export default function RemotePage() {
  return <RemoteApp />
}
