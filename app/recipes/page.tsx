import type { Metadata } from "next"

import { RecipesApp } from "@/components/recipes/recipes-app"

export const metadata: Metadata = {
  title: "Recipe scaler",
  description: "Scale ingredient amounts by servings with print layout.",
}

export default function RecipesPage() {
  return <RecipesApp />
}
