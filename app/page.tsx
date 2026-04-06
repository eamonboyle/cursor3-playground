import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PLAYGROUND_DEMOS } from "@/lib/playground/demos"

export default function Page() {
  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cursor 3 playground
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Small demo apps for trying multi-step edits and UI polish. Open the
          command palette with{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            ⌘K
          </kbd>{" "}
          or{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            Ctrl+K
          </kbd>
          . Press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            d
          </kbd>{" "}
          to toggle dark mode when focus is not in a field.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {PLAYGROUND_DEMOS.map((demo) => (
          <li key={demo.href}>
            <Card className="h-full">
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{demo.title}</CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {demo.kind === "api" ? "API" : "Client"}
                  </Badge>
                </div>
                <CardDescription>{demo.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button asChild>
                  <Link href={demo.href}>Open</Link>
                </Button>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
