/** Sample ripgrep -n output for the demo textarea. */
export const SAMPLE_GREP_OUTPUT = `lib/finance/compute.ts:12:export function sumTransactions(
lib/finance/compute.ts:41:  // balance rollover logic
components/crm/crm-app.tsx:88:  const [draft, setDraft] = React.useState("")
components/crm/crm-app.tsx:128:    {/* sheet focus trap */}
lib/env/diff.ts:19:export function maskSecret(value: string): string {
lib/playground/demos.ts:10:export const PLAYGROUND_DEMOS: PlaygroundDemo[] = [
node_modules/foo/index.js:1:module.exports = {}
app/api/rsvp/route.ts:7:const store: RsvpEntry[] = []
`

/** Sample ripgrep -C context block for the demo. */
export const SAMPLE_GREP_CONTEXT = `lib/grep/parse.ts
41-function isNodeModulesPath(path: string): boolean {
42:  return /(?:^|\\/)node_modules(?:\\/|$)/.test(path)
43-}
--
components/grep/grep-app.tsx
18-  CardHeader,
19:  CardTitle,
20-} from "@/components/ui/card"
`
