"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { loadNotes, saveNotes } from "@/lib/notes/storage"
import type { Note } from "@/lib/notes/types"

export function NotesApp() {
  const [notes, setNotes] = React.useState<Note[]>([])
  const [activeId, setActiveId] = React.useState<string>("")
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  React.useEffect(() => {
    const n = loadNotes()
    setNotes(n)
    setActiveId(n[0]?.id ?? "")
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveNotes(notes)
  }, [notes])

  const active = notes.find((n) => n.id === activeId)

  const sorted = React.useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes],
  )

  function updateActive(partial: Partial<Pick<Note, "title" | "body">>) {
    if (!activeId) {
      return
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, ...partial } : n)),
    )
  }

  function bumpActiveTimestamp() {
    if (!activeId) {
      return
    }
    const ts = new Date().toISOString()
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, updatedAt: ts } : n)),
    )
  }

  function addNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      body: "",
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
    toast.success("New note created.")
  }

  function exportNote() {
    if (!active) {
      return
    }
    const slug = (active.title || "note")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    const md = `# ${active.title || "Untitled"}\n\n${active.body}`
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug || "note"}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Download started.")
  }

  function removeNote() {
    if (!activeId || notes.length <= 1) {
      toast.error("Keep at least one note.")
      return
    }
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== activeId)
      setActiveId(next[0]?.id ?? "")
      return next
    })
    toast.success("Note deleted.")
  }

  if (!ready || !active) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading notes…</span>
      </div>
    )
  }

  return (
    <SidebarProvider className="min-h-svh">
      <Sidebar>
        <SidebarHeader className="gap-2 border-b border-sidebar-border p-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link href="/">Playground</Link>
          </Button>
          <Button type="button" className="w-full" size="sm" onClick={addNote}>
            New note
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Notes</SidebarGroupLabel>
            <SidebarMenu>
              {sorted.map((n) => (
                <SidebarMenuItem key={n.id}>
                  <SidebarMenuButton
                    isActive={n.id === activeId}
                    onClick={() => setActiveId(n.id)}
                  >
                    <span className="truncate">
                      {n.title.trim() || "Untitled"}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground">
            Markdown notes
          </span>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={exportNote}>
              Export .md
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={removeNote}
            >
              Delete note
            </Button>
          </div>
          <Input
            value={active.title}
            onChange={(e) => updateActive({ title: e.target.value })}
            onBlur={bumpActiveTimestamp}
            className="text-lg font-semibold"
            placeholder="Title"
            aria-label="Note title"
          />
          <Textarea
            value={active.body}
            onChange={(e) => updateActive({ body: e.target.value })}
            onBlur={bumpActiveTimestamp}
            className="min-h-[50vh] flex-1 resize-none font-mono text-sm leading-relaxed"
            placeholder="Write markdown…"
            aria-label="Note body"
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
