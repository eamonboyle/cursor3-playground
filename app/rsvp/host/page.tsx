import type { Metadata } from "next"

import { RsvpHostApp } from "@/components/rsvp/rsvp-host-app"

export const metadata: Metadata = {
  title: "RSVP host",
  description: "View RSVP responses and chart.",
}

export default function RsvpHostPage() {
  return <RsvpHostApp />
}
