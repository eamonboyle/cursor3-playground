import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Page() {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cursor 3 playground
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This repo ships with shadcn/ui and Next.js. Use it to try multi-step
          edits, UI polish, and small product slices. Press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            d
          </kbd>{" "}
          to toggle dark mode (when not typing in a field).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Finance sandbox</CardTitle>
          <CardDescription>
            Personal budget demo: categories, monthly caps, transactions, bar
            chart, and tabs — persisted in{" "}
            <span className="font-mono text-xs">localStorage</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/finance">Open finance app</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
