"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { loadContacts, saveContacts } from "@/lib/crm/storage"
import type { Contact } from "@/lib/crm/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserMultiple02Icon } from "@hugeicons/core-free-icons"

function emptyContact(): Contact {
  return {
    id: "",
    name: "",
    email: "",
    company: "",
    tags: [],
    notes: "",
  }
}

export function CrmApp() {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [ready, setReady] = React.useState(false)
  const skipSave = React.useRef(true)

  const [query, setQuery] = React.useState("")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Contact>(emptyContact())
  const [isNew, setIsNew] = React.useState(false)

  React.useEffect(() => {
    setContacts(loadContacts())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveContacts(contacts)
  }, [contacts])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return contacts
    }
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [contacts, query])

  function openContact(c: Contact) {
    setDraft({ ...c })
    setIsNew(false)
    setSheetOpen(true)
  }

  function openNew() {
    setDraft(emptyContact())
    setIsNew(true)
    setSheetOpen(true)
  }

  function saveDraft() {
    const name = draft.name.trim()
    const email = draft.email.trim()
    if (!name || !email) {
      toast.error("Name and email are required.")
      return
    }
    const tags = draft.tags
      .join(",")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    if (isNew) {
      const c: Contact = {
        ...draft,
        id: crypto.randomUUID(),
        name,
        email,
        tags,
      }
      setContacts((prev) => [...prev, c])
      setQuery("")
      toast.success("Contact added.")
    } else {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === draft.id ? { ...draft, name, email, tags } : c,
        ),
      )
      toast.success("Contact updated.")
    }
    setSheetOpen(false)
  }

  function removeDraft() {
    if (!draft.id || isNew) {
      setSheetOpen(false)
      return
    }
    setContacts((prev) => prev.filter((c) => c.id !== draft.id))
    toast.success("Contact removed.")
    setSheetOpen(false)
  }

  if (!ready) {
    return (
      <div
        className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-5" />
        <span>Loading contacts…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/">Back to playground</Link>
          </Button>
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={UserMultiple02Icon}
              strokeWidth={2}
              className="size-8 text-primary"
              aria-hidden
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Tiny CRM
              </h1>
              <p className="text-sm text-muted-foreground">
                Search cards, open a contact in a sheet, edit in place. Stored
                in localStorage.
              </p>
            </div>
          </div>
        </div>
        <Button type="button" onClick={openNew}>
          New contact
        </Button>
      </header>

      <Field className="max-w-md gap-1.5">
        <FieldLabel htmlFor="crm-search">Search</FieldLabel>
        <FieldContent>
          <Input
            id="crm-search"
            placeholder="Name, email, company, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FieldContent>
      </Field>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => openContact(c)}
            >
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {c.email}
                  </CardDescription>
                  {c.company ? (
                    <p className="text-xs text-muted-foreground">{c.company}</p>
                  ) : null}
                  {c.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardHeader>
              </Card>
            </button>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {query.trim()
            ? "No contacts match your search."
            : "No contacts yet. Use New contact to add one."}
        </p>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isNew ? "New contact" : "Edit contact"}</SheetTitle>
            <SheetDescription>
              Changes save when you press Save.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <Field>
              <FieldLabel htmlFor="crm-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="crm-name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="crm-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="crm-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="crm-company">Company</FieldLabel>
              <FieldContent>
                <Input
                  id="crm-company"
                  value={draft.company}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, company: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="crm-tags">Tags</FieldLabel>
              <FieldContent>
                <Input
                  id="crm-tags"
                  value={draft.tags.join(", ")}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    }))
                  }
                  placeholder="design, priority"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="crm-notes">Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  id="crm-notes"
                  rows={4}
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, notes: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
          </div>
          <SheetFooter className="mt-auto border-t pt-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
              {!isNew && draft.id ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  onClick={removeDraft}
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveDraft}>
                  Save
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — CRM demo.
      </footer>
    </div>
  )
}
