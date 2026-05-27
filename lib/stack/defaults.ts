import type { StackPersisted } from "./types"

export function defaultStackPersisted(): StackPersisted {
  return {
    text: SAMPLE_STACK_TRACE,
    hideNodeModules: true,
    hideInternals: true,
  }
}

/** Mixed Node / Next.js style trace for the demo textarea. */
export const SAMPLE_STACK_TRACE = `Error: Cannot read properties of undefined (reading 'map')
    at RecipeList (webpack-internal:///(app-pages-browser)/./components/recipes/recipes-app.tsx:84:18)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:11103:18)
    at updateFunctionComponent (node_modules/react-dom/cjs/react-dom.development.js:16290:20)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
  File "/workspace/lib/recipes/scale.ts", line 12, in scaleIngredient
    return amount * ratio
`
