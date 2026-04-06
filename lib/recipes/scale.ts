import type { Ingredient } from "./data"

export function scaleIngredients(
  ingredients: Ingredient[],
  baseServings: number,
  targetServings: number,
): Ingredient[] {
  if (baseServings <= 0) {
    return ingredients
  }
  const factor = targetServings / baseServings
  return ingredients.map((ing) => ({
    ...ing,
    amount: Math.round(ing.amount * factor * 1000) / 1000,
  }))
}

export function formatAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return String(amount)
  }
  const t = Math.round(amount * 100) / 100
  return t.toString()
}
