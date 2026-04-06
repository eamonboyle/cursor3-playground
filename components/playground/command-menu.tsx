"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import * as React from "react"
import { toast } from "sonner"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { PLAYGROUND_DEMOS } from "@/lib/playground/demos"

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export function PlaygroundCommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return
      }
      if (isTypingTarget(event.target)) {
        return
      }
      event.preventDefault()
      setOpen((o) => !o)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
      <Command>
        <CommandInput placeholder="Jump to a demo or run a command…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Demos">
            {PLAYGROUND_DEMOS.map((d) => (
              <CommandItem
                key={d.href}
                value={`${d.title} ${d.href}`}
                onSelect={() => {
                  router.push(d.href)
                  setOpen(false)
                }}
              >
                {d.title}
                <CommandShortcut>{d.href}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Playground">
            <CommandItem
              value="toggle theme appearance dark light"
              onSelect={() => {
                toggleTheme()
                setOpen(false)
              }}
            >
              Toggle theme
              <CommandShortcut>uses next-themes</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="toast sample notification"
              onSelect={() => {
                toast.success("Sample toast from the command palette.")
                setOpen(false)
              }}
            >
              Show sample toast
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
