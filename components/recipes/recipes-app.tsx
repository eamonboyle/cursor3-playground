"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { DEMO_RECIPE } from "@/lib/recipes/data"
import { formatAmount, scaleIngredients } from "@/lib/recipes/scale"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChefHatIcon } from "@hugeicons/core-free-icons"

export function RecipesApp() {
  const [servings, setServings] = React.useState(DEMO_RECIPE.baseServings)

  const scaled = scaleIngredients(
    DEMO_RECIPE.ingredients,
    DEMO_RECIPE.baseServings,
    servings,
  )

  return (
    <div className="recipe-print-root mx-auto flex min-h-svh max-w-2xl flex-col gap-8 p-6">
      <header className="recipe-print-hide flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/">Back to playground</Link>
        </Button>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={ChefHatIcon}
            strokeWidth={2}
            className="size-8 text-primary"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Recipe scaler
            </h1>
            <p className="text-sm text-muted-foreground">
              Adjust servings; amounts scale in place. Use print for a clean
              sheet.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="recipe-print-hide">
          <CardTitle>Servings</CardTitle>
          <CardDescription>
            Base recipe is written for {DEMO_RECIPE.baseServings} servings.
          </CardDescription>
        </CardHeader>
        <CardContent className="recipe-print-hide flex flex-col gap-4">
          <Slider
            value={[servings]}
            onValueChange={([v]) => setServings(v ?? DEMO_RECIPE.baseServings)}
            min={1}
            max={16}
            step={1}
            aria-label="Number of servings"
          />
          <p className="text-center font-mono text-sm tabular-nums">
            {servings} serving{servings === 1 ? "" : "s"}
          </p>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Print recipe
          </Button>
        </CardContent>
      </Card>

      <article className="rounded-xl border bg-card p-6 shadow-xs print:border-0 print:shadow-none">
        <h2 className="text-xl font-semibold tracking-tight">
          {DEMO_RECIPE.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground print:text-foreground">
          Scaled for {servings} serving{servings === 1 ? "" : "s"}.
        </p>
        <Separator className="my-4" />
        <h3 className="mb-2 text-sm font-medium">Ingredients</h3>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed">
          {scaled.map((ing) => (
            <li key={ing.name}>
              <span className="font-mono tabular-nums">
                {formatAmount(ing.amount)} {ing.unit}
              </span>{" "}
              {ing.name}
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <h3 className="mb-2 text-sm font-medium">Steps</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed">
          {DEMO_RECIPE.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <footer className="recipe-print-hide text-center text-xs text-muted-foreground">
        Cursor 3 playground — recipe demo.
      </footer>
    </div>
  )
}
