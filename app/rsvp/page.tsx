import type { Metadata } from "next"

import { RsvpFormApp } from "@/components/rsvp/rsvp-form-app"

export const metadata: Metadata = {
  title: "Event RSVP",
  description: "Submit RSVP via API route (demo).",
}

export default function RsvpPage() {
  return <RsvpFormApp />
}
