import type { ReactNode } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PLAYGROUND_DEMOS } from "@/lib/playground/demos"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border/90 bg-muted/90 px-2 py-0.5 font-mono text-[0.68rem] font-medium text-muted-foreground shadow-[inset_0_-1px_0_0_oklch(0_0_0/0.06)] dark:shadow-[inset_0_-1px_0_0_oklch(1_0_0/0.08)]">
      {children}
    </kbd>
  )
}

export default function Page() {
  return (
    <div className="relative mx-auto min-h-svh max-w-6xl px-5 pb-28 pt-14 sm:px-8 lg:px-12 lg:pt-20">
      <header
        className="playground-animate-in mb-16 max-w-2xl lg:mb-24 lg:max-w-3xl"
        style={{ animationDelay: "0ms" }}
      >
        <p className="font-display text-primary mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em] sm:text-xs">
          Prototype lab
        </p>
        <h1 className="font-display text-foreground text-[2.35rem] leading-[1.05] font-medium tracking-[-0.02em] sm:text-5xl lg:text-[3.35rem]">
          Cursor{" "}
          <span className="text-primary italic">playground</span>
        </h1>
        <div
          className="mt-8 h-px w-28 bg-gradient-to-r from-primary via-primary/60 to-transparent"
          aria-hidden
        />
        <p className="text-muted-foreground mt-8 max-w-xl text-[1.05rem] leading-relaxed sm:text-lg">
          Small, self-contained apps for multi-step UI work—charts, timers,
          APIs, and print layouts. Everything runs locally; demos are meant to
          feel tactile and fast.
        </p>
        <dl className="mt-10 grid max-w-lg gap-5 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary/90">
              Navigate
            </dt>
            <dd className="text-muted-foreground leading-snug">
              Jump anywhere with <Kbd>⌘K</Kbd> or <Kbd>Ctrl K</Kbd>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary/90">
              Theme
            </dt>
            <dd className="text-muted-foreground leading-snug">
              Toggle with <Kbd>d</Kbd> when not typing in a field
            </dd>
          </div>
        </dl>
      </header>

      <ul className="grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PLAYGROUND_DEMOS.map((demo, i) => (
          <li
            key={demo.href}
            className="playground-animate-in min-h-0"
            style={{ animationDelay: `${90 + i * 48}ms` }}
          >
            <Link
              href={demo.href}
              className="group block h-full rounded-4xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="relative h-full overflow-hidden border-border/70 bg-card/80 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-[0_24px_56px_-28px_oklch(0.52_0.14_38_/_0.38)] dark:ring-white/[0.06] dark:hover:shadow-[0_24px_56px_-28px_oklch(0.68_0.12_45_/_0.28)]">
                <div
                  className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b from-primary/80 via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <CardHeader className="gap-3 pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="font-display text-xl font-medium tracking-tight sm:text-[1.35rem]">
                      {demo.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-primary/20 bg-primary/[0.06] font-mono text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground"
                    >
                      {demo.kind === "api" ? "API" : "Client"}
                    </Badge>
                  </div>
                  <CardDescription className="text-[0.925rem] leading-relaxed text-pretty">
                    {demo.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <span className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                    Open
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
