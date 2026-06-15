/** Sample `pnpm outdated` table output for the demo textarea. */
export const SAMPLE_OUTDATED_TABLE = `┌──────────────────┬─────────┬────────┐
│ Package          │ Current │ Latest │
├──────────────────┼─────────┼────────┤
│ radix-ui         │ 1.4.3   │ 1.5.0  │
├──────────────────┼─────────┼────────┤
│ shadcn           │ 4.8.3   │ 4.11.0 │
├──────────────────┼─────────┼────────┤
│ eslint (dev)     │ 9.39.4  │ 10.5.0 │
├──────────────────┼─────────┼────────┤
│ react-day-picker │ 9.14.0  │ 10.0.1 │
├──────────────────┼─────────┼────────┤
│ typescript (dev) │ 5.9.3   │ 6.0.3  │
└──────────────────┴─────────┴────────┘`

/** Sample \`pnpm outdated --format json\` output. */
export const SAMPLE_OUTDATED_JSON = `{
  "radix-ui": {
    "current": "1.4.3",
    "latest": "1.5.0",
    "wanted": "1.4.3",
    "isDeprecated": false,
    "dependencyType": "dependencies"
  },
  "eslint": {
    "current": "9.39.4",
    "latest": "10.5.0",
    "wanted": "9.39.4",
    "isDeprecated": false,
    "dependencyType": "devDependencies"
  }
}`
