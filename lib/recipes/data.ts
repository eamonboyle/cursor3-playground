export type Ingredient = {
  amount: number
  unit: string
  name: string
}

export const DEMO_RECIPE = {
  title: "Weekend pancakes",
  baseServings: 4,
  steps: [
    "Whisk dry ingredients in a large bowl.",
    "Mix wet ingredients separately, then fold into dry until just combined.",
    "Rest batter 5 minutes. Cook on a medium griddle until bubbles form, then flip.",
  ],
  ingredients: [
    { amount: 200, unit: "g", name: "all-purpose flour" },
    { amount: 2, unit: "tsp", name: "baking powder" },
    { amount: 0.5, unit: "tsp", name: "salt" },
    { amount: 1, unit: "tbsp", name: "sugar" },
    { amount: 300, unit: "ml", name: "milk" },
    { amount: 1, unit: "large", name: "egg" },
    { amount: 2, unit: "tbsp", name: "melted butter" },
  ] satisfies Ingredient[],
}
