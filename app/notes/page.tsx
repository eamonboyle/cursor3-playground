import type { Metadata } from "next"

import { NotesApp } from "@/components/notes/notes-app"

export const metadata: Metadata = {
  title: "Markdown notes",
  description: "Sidebar notes with markdown export.",
}

export default function NotesPage() {
  return <NotesApp />
}
