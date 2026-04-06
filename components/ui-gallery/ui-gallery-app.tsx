"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, PaintBoardIcon } from "@hugeicons/core-free-icons"

const SNIPPETS = {
  button: `<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`,
  input: `<Input placeholder="Email" type="email" />
<Input disabled placeholder="Disabled" />`,
  alert: `<Alert>
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>Short supporting copy.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>`,
} as const

function CopyRow({ label, code }: { label: string; code: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code.trim())
      toast.success("Copied snippet.")
    } catch {
      toast.error("Clipboard not available.")
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed">
          {code.trim()}
        </pre>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => void copy()}
      >
        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
        Copy
      </Button>
    </div>
  )
}

export function UiGalleryApp() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={PaintBoardIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              UI gallery
            </h1>
            <p className="text-sm text-muted-foreground">
              Living reference for a few shadcn primitives with copyable JSX
              snippets (paste into your own components and fix imports).
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Live samples</CardTitle>
          <CardDescription>Interactive examples below each tab.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buttons">
            <TabsList className="mb-4 w-full flex-wrap justify-start">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="buttons" className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <CopyRow label="Button variants" code={SNIPPETS.button} />
            </TabsContent>
            <TabsContent value="inputs" className="flex flex-col gap-6">
              <div className="flex max-w-sm flex-col gap-3">
                <Input placeholder="Email" type="email" />
                <Input disabled placeholder="Disabled" />
              </div>
              <CopyRow label="Input" code={SNIPPETS.input} />
            </TabsContent>
            <TabsContent value="feedback" className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Alert>
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>Short supporting copy.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Something went wrong.</AlertDescription>
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>
              <CopyRow label="Alert markup" code={SNIPPETS.alert} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground">
        Cursor 3 playground — UI gallery demo.
      </footer>
    </div>
  )
}
